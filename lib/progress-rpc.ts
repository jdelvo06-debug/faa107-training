import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeProgress } from "@/lib/progress-merge";
import type { ProgressRpcResult, ProgressState } from "@/lib/types";

const DECIMAL_PATTERN = /^(0|[1-9][0-9]*)$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface ProgressRemoteRow {
  progress: ProgressState;
  revision: string;
  resetGeneration: string;
  resetEpoch: string;
}

export type ProgressFetchResult =
  | { status: "missing" }
  | { status: "ok"; row: ProgressRemoteRow };

export interface ProgressCommitInput {
  expectedRevision: string | null;
  expectedGeneration: string | null;
  baseProgress: ProgressState;
  proposedProgress: ProgressState;
  operationId: string;
}

export interface ProgressResetInput {
  operationId: string;
}

export interface ProgressResetResult extends ProgressRemoteRow {
  status: "reset" | "duplicate";
}

export type ProgressRpcErrorKind = "auth" | "transient" | "validation" | "unsupported";

export class ProgressRpcError extends Error {
  readonly kind: ProgressRpcErrorKind;

  constructor(kind: ProgressRpcErrorKind, message: string) {
    super(message);
    this.name = "ProgressRpcError";
    this.kind = kind;
  }
}

export interface ProgressRpcAdapter {
  fetch(userId: string, signal?: AbortSignal): Promise<ProgressFetchResult>;
  commit(input: ProgressCommitInput, signal?: AbortSignal): Promise<ProgressRpcResult>;
  reset(input: ProgressResetInput, signal?: AbortSignal): Promise<ProgressResetResult>;
  subscribe(userId: string, listener: (row: ProgressRemoteRow) => void): () => void;
  refreshRealtimeAuth(token: string): void;
}

type DatabaseError = {
  code?: string;
  message?: string;
  status?: number;
};

function classifyError(error: DatabaseError): ProgressRpcError {
  const message = error.message ?? "Progress sync request failed";
  const normalized = message.toLowerCase();
  const status = error.status;
  if (status === 401 || status === 403 || /jwt|permission|unauth|forbidden/.test(normalized)) {
    return new ProgressRpcError("auth", message);
  }
  if (/unsupported.*version|update required/.test(normalized)) {
    return new ProgressRpcError("unsupported", message);
  }
  if (status === 400 || error.code === "22023" || /invalid|payload|256 kib|too large/.test(normalized)) {
    return new ProgressRpcError("validation", message);
  }
  return new ProgressRpcError("transient", message);
}

function decimalString(value: unknown, field: string): string {
  if (typeof value === "string" && DECIMAL_PATTERN.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  throw new ProgressRpcError("validation", `Invalid ${field} returned by progress service`);
}

function progressState(value: unknown): ProgressState {
  const normalized = normalizeProgress(value);
  if (normalized.status === "unsupported") {
    throw new ProgressRpcError("unsupported", "Update required to read synced progress");
  }
  if (normalized.status !== "ok") {
    throw new ProgressRpcError("validation", "Invalid progress returned by progress service");
  }
  return normalized.progress;
}

function remoteRow(value: unknown): ProgressRemoteRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProgressRpcError("validation", "Invalid progress row returned by progress service");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.reset_generation !== "string" || !UUID_PATTERN.test(record.reset_generation)) {
    throw new ProgressRpcError("validation", "Invalid reset generation returned by progress service");
  }
  return {
    progress: progressState(record.progress),
    revision: decimalString(record.revision, "revision"),
    resetGeneration: record.reset_generation,
    resetEpoch: decimalString(record.reset_epoch, "reset epoch"),
  };
}

function resultRecord(value: unknown): Record<string, unknown> {
  const record = Array.isArray(value) ? value[0] : value;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new ProgressRpcError("validation", "Progress service returned no result");
  }
  return record as Record<string, unknown>;
}

function commitResult(value: unknown): ProgressRpcResult {
  const record = resultRecord(value);
  const status = record.status;
  if (typeof status !== "string" || ![
    "current",
    "committed",
    "revision_conflict",
    "first_row_race",
    "pre_generation_rejected",
    "generation_mismatch",
    "duplicate",
  ].includes(status)) {
    throw new ProgressRpcError("validation", "Progress service returned an invalid status");
  }
  return { status, ...remoteRow(record) } as ProgressRpcResult;
}

function resetResult(value: unknown): ProgressResetResult {
  const record = resultRecord(value);
  if (record.status !== "reset" && record.status !== "duplicate") {
    throw new ProgressRpcError("validation", "Progress service returned an invalid reset status");
  }
  return { status: record.status, ...remoteRow(record) };
}

export function createProgressRpcAdapter(client: SupabaseClient): ProgressRpcAdapter {
  return {
    async fetch(userId, signal) {
      if (!UUID_PATTERN.test(userId)) throw new Error("Progress owner must be a valid lowercase UUID");
      let request = client
        .from("faa107_user_progress")
        .select("user_id,progress,revision,reset_generation,reset_epoch")
        .eq("user_id", userId);
      if (signal) request = request.abortSignal(signal);
      const { data, error } = await request.maybeSingle();
      if (error) throw classifyError(error);
      return data === null ? { status: "missing" } : { status: "ok", row: remoteRow(data) };
    },

    async commit(input, signal) {
      let request = client.rpc("commit_faa107_progress", {
        expected_revision: input.expectedRevision,
        expected_generation: input.expectedGeneration,
        base_progress: input.baseProgress,
        proposed_progress: input.proposedProgress,
        operation_id: input.operationId,
      });
      if (signal) request = request.abortSignal(signal);
      const { data, error } = await request;
      if (error) throw classifyError(error);
      return commitResult(data);
    },

    async reset(input, signal) {
      let request = client.rpc("reset_faa107_progress", {
        operation_id: input.operationId,
      });
      if (signal) request = request.abortSignal(signal);
      const { data, error } = await request;
      if (error) throw classifyError(error);
      return resetResult(data);
    },

    subscribe(userId, listener) {
      if (!UUID_PATTERN.test(userId)) throw new Error("Progress owner must be a valid lowercase UUID");
      const channel = client
        .channel(`faa107-progress-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "faa107_user_progress",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            try {
              listener(remoteRow(payload.new));
            } catch {
              // A malformed event is ignored; the next lifecycle fetch remains authoritative.
            }
          },
        )
        .subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    },

    refreshRealtimeAuth(token) {
      client.realtime.setAuth(token);
    },
  };
}
