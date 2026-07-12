import {
  canonicalEmptyProgress,
  canonicalProgressJson,
  normalizeProgress,
} from "@/lib/progress-merge";
import type {
  AnonymousImportClaim,
  AuthenticatedProgressCacheEnvelope,
  ProgressState,
  ProgressUnsyncedMarker,
} from "@/lib/types";

export const anonymousProgressKey = "faa107-progress-v1";
export const anonymousImportKey = "faa107-progress-anonymous-import-v1";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DECIMAL_PATTERN = /^(0|[1-9][0-9]*)$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

export interface ProgressStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ProgressLockManager {
  request<T>(
    name: string,
    options: { mode: "exclusive" },
    callback: () => Promise<T> | T,
  ): Promise<T>;
}

export type AuthenticatedCacheReadResult =
  | { status: "missing" }
  | { status: "ok"; envelope: AuthenticatedProgressCacheEnvelope }
  | { status: "unsupported"; raw: string; version: number }
  | { status: "invalid"; raw: string };

export type AnonymousClaimResult =
  | { status: "claimed" | "pending" | "complete"; claim: AnonymousImportClaim }
  | { status: "empty" | "owned-by-other" | "unavailable" };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertOwnerUserId(userId: string): void {
  if (!UUID_PATTERN.test(userId)) throw new Error("Owner user ID must be a valid lowercase UUID");
}

function isCanonicalDecimal(value: unknown): value is string {
  return typeof value === "string" && DECIMAL_PATTERN.test(value);
}

function isGeneration(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function progressKeyForUser(userId: string): string {
  assertOwnerUserId(userId);
  return `${anonymousProgressKey}:${userId}`;
}

export function unsyncedKeyForUser(userId: string): string {
  assertOwnerUserId(userId);
  return `faa107-progress-unsynced-v1:${userId}`;
}

export function createNeverSyncedEnvelope(
  progress: ProgressState,
  now = new Date(),
): AuthenticatedProgressCacheEnvelope {
  const normalized = normalizeProgress(progress, now);
  if (normalized.status !== "ok") throw new Error("Cannot cache invalid progress");
  return {
    envelopeVersion: 1,
    progress: normalized.progress,
    resetGeneration: null,
    resetEpoch: null,
    revision: null,
    baseProgress: null,
  };
}

function parseEnvelope(raw: string, now: Date): AuthenticatedCacheReadResult {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "invalid", raw };
  }
  if (!isPlainObject(value)) return { status: "invalid", raw };
  if (typeof value.envelopeVersion === "number" && value.envelopeVersion > 1) {
    return { status: "unsupported", raw, version: value.envelopeVersion };
  }
  if (value.envelopeVersion !== 1) return { status: "invalid", raw };
  const progress = normalizeProgress(value.progress, now);
  if (progress.status === "unsupported") return { status: "unsupported", raw, version: progress.version };
  if (progress.status !== "ok") return { status: "invalid", raw };

  const allNull = value.resetGeneration === null
    && value.resetEpoch === null
    && value.revision === null
    && value.baseProgress === null;
  const allTagged = isGeneration(value.resetGeneration)
    && isCanonicalDecimal(value.resetEpoch)
    && isCanonicalDecimal(value.revision)
    && value.baseProgress !== null;
  if (!allNull && !allTagged) return { status: "invalid", raw };

  let baseProgress: ProgressState | null = null;
  if (allTagged) {
    const base = normalizeProgress(value.baseProgress, now);
    if (base.status === "unsupported") return { status: "unsupported", raw, version: base.version };
    if (base.status !== "ok") return { status: "invalid", raw };
    baseProgress = base.progress;
  }
  return {
    status: "ok",
    envelope: {
      envelopeVersion: 1,
      progress: progress.progress,
      resetGeneration: allTagged ? value.resetGeneration as string : null,
      resetEpoch: allTagged ? value.resetEpoch as string : null,
      revision: allTagged ? value.revision as string : null,
      baseProgress,
    },
  };
}

export function readAuthenticatedCache(
  storage: ProgressStorageAdapter,
  userId: string,
  now = new Date(),
): AuthenticatedCacheReadResult {
  const key = progressKeyForUser(userId);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: "invalid", raw: "" };
  }
  return raw === null ? { status: "missing" } : parseEnvelope(raw, now);
}

function normalizeEnvelope(
  envelope: AuthenticatedProgressCacheEnvelope,
  now: Date,
): AuthenticatedProgressCacheEnvelope {
  const parsed = parseEnvelope(JSON.stringify(envelope), now);
  if (parsed.status !== "ok") throw new Error("Cannot cache an invalid authenticated envelope");
  return parsed.envelope;
}

export function writeAuthenticatedCache(
  storage: ProgressStorageAdapter,
  userId: string,
  envelope: AuthenticatedProgressCacheEnvelope,
  now = new Date(),
): AuthenticatedProgressCacheEnvelope {
  const normalized = normalizeEnvelope(envelope, now);
  storage.setItem(progressKeyForUser(userId), JSON.stringify(normalized));
  return normalized;
}

export function updateAuthenticatedProgress(
  storage: ProgressStorageAdapter,
  userId: string,
  progress: ProgressState,
  now = new Date(),
): AuthenticatedProgressCacheEnvelope {
  const current = readAuthenticatedCache(storage, userId, now);
  if (current.status === "invalid" || current.status === "unsupported") {
    throw new Error("Cannot overwrite an unverified authenticated cache");
  }
  const envelope = current.status === "missing"
    ? createNeverSyncedEnvelope(progress, now)
    : { ...current.envelope, progress };
  return writeAuthenticatedCache(storage, userId, envelope, now);
}

export function classifyAuthenticatedEnvelope(
  envelope: AuthenticatedProgressCacheEnvelope,
  remoteGeneration: string,
  remoteEpoch: string,
): "current" | "stale" | "unverified" {
  if (!isGeneration(remoteGeneration) || !isCanonicalDecimal(remoteEpoch)) {
    throw new Error("Remote progress metadata is invalid");
  }
  if (envelope.resetGeneration === null || envelope.resetEpoch === null) return "unverified";
  return envelope.resetGeneration === remoteGeneration && envelope.resetEpoch === remoteEpoch
    ? "current"
    : "stale";
}

export function writeUnsyncedMarker(
  storage: ProgressStorageAdapter,
  userId: string,
  marker: ProgressUnsyncedMarker,
): void {
  if (marker.dirty !== true
    || (marker.resetGeneration !== null && !isGeneration(marker.resetGeneration))
    || (marker.lastAttemptAt !== null && typeof marker.lastAttemptAt !== "string")) {
    throw new Error("Invalid progress unsynced marker");
  }
  storage.setItem(unsyncedKeyForUser(userId), JSON.stringify(marker));
}

export function readUnsyncedMarker(
  storage: ProgressStorageAdapter,
  userId: string,
): ProgressUnsyncedMarker | null {
  try {
    const raw = storage.getItem(unsyncedKeyForUser(userId));
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    if (!isPlainObject(value)
      || value.dirty !== true
      || (value.resetGeneration !== null && !isGeneration(value.resetGeneration))
      || (value.lastAttemptAt !== null && typeof value.lastAttemptAt !== "string")) {
      return null;
    }
    return {
      dirty: true,
      resetGeneration: value.resetGeneration as string | null,
      lastAttemptAt: value.lastAttemptAt as string | null,
    };
  } catch {
    return null;
  }
}

export function clearUnsyncedMarker(storage: ProgressStorageAdapter, userId: string): void {
  storage.removeItem(unsyncedKeyForUser(userId));
}

export async function hashProgressSnapshot(progress: ProgressState, now = new Date()): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalProgressJson(progress, now));
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is unavailable");
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function parseClaim(raw: string, now: Date): Promise<AnonymousImportClaim | null> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainObject(value)
    || typeof value.ownerUserId !== "string"
    || !UUID_PATTERN.test(value.ownerUserId)
    || (value.state !== "pending" && value.state !== "complete")
    || typeof value.snapshotHash !== "string"
    || !HASH_PATTERN.test(value.snapshotHash)) {
    return null;
  }
  if (value.state === "complete") {
    if (value.snapshot !== undefined) return null;
    return { ownerUserId: value.ownerUserId, state: "complete", snapshotHash: value.snapshotHash };
  }
  const snapshot = normalizeProgress(value.snapshot, now);
  if (snapshot.status !== "ok") return null;
  const snapshotHash = await hashProgressSnapshot(snapshot.progress, now);
  if (snapshotHash !== value.snapshotHash) return null;
  return {
    ownerUserId: value.ownerUserId,
    state: "pending",
    snapshotHash,
    snapshot: snapshot.progress,
  };
}

async function readClaim(storage: ProgressStorageAdapter, now: Date): Promise<AnonymousImportClaim | null> {
  const raw = storage.getItem(anonymousImportKey);
  return raw ? parseClaim(raw, now) : null;
}

function writeAndVerify(storage: ProgressStorageAdapter, key: string, value: unknown): boolean {
  const raw = JSON.stringify(value);
  storage.setItem(key, raw);
  return storage.getItem(key) === raw;
}

export async function readAnonymousImportSnapshot(
  storage: ProgressStorageAdapter,
  ownerUserId: string,
  now = new Date(),
): Promise<AnonymousImportClaim | null> {
  assertOwnerUserId(ownerUserId);
  try {
    const claim = await readClaim(storage, now);
    return claim?.ownerUserId === ownerUserId && claim.state === "pending" ? claim : null;
  } catch {
    return null;
  }
}

export async function claimAnonymousProgress(
  storage: ProgressStorageAdapter,
  locks: ProgressLockManager | null | undefined,
  ownerUserId: string,
  now = new Date(),
): Promise<AnonymousClaimResult> {
  assertOwnerUserId(ownerUserId);
  if (!locks) return { status: "unavailable" };
  try {
    return await locks.request(anonymousImportKey, { mode: "exclusive" }, async () => {
      const existingRaw = storage.getItem(anonymousImportKey);
      if (existingRaw) {
        const existing = await parseClaim(existingRaw, now);
        if (!existing) return { status: "unavailable" } as const;
        if (existing.ownerUserId !== ownerUserId) return { status: "owned-by-other" } as const;
        return { status: existing.state, claim: existing } as const;
      }
      const anonymousRaw = storage.getItem(anonymousProgressKey);
      if (!anonymousRaw) return { status: "empty" } as const;
      let anonymousValue: unknown;
      try {
        anonymousValue = JSON.parse(anonymousRaw);
      } catch {
        return { status: "unavailable" } as const;
      }
      const normalized = normalizeProgress(anonymousValue, now);
      if (normalized.status !== "ok") return { status: "unavailable" } as const;
      if (canonicalProgressJson(normalized.progress, now) === canonicalProgressJson(canonicalEmptyProgress, now)) {
        return { status: "empty" } as const;
      }
      const claim: AnonymousImportClaim = {
        ownerUserId,
        state: "pending",
        snapshotHash: await hashProgressSnapshot(normalized.progress, now),
        snapshot: normalized.progress,
      };
      let claimVerified = false;
      try {
        claimVerified = writeAndVerify(storage, anonymousImportKey, claim);
      } catch {
        claimVerified = false;
      }
      if (!claimVerified) {
        try {
          storage.removeItem(anonymousImportKey);
        } catch {
          // Import remains unavailable when storage cannot clean up either.
        }
        return { status: "unavailable" } as const;
      }
      const verified = await readClaim(storage, now);
      if (!verified || verified.ownerUserId !== ownerUserId || verified.state !== "pending") {
        try {
          storage.removeItem(anonymousImportKey);
        } catch {
          // The caller still treats this browser as unavailable for import.
        }
        return { status: "unavailable" } as const;
      }
      return { status: "claimed", claim: verified } as const;
    });
  } catch {
    return { status: "unavailable" };
  }
}

export async function completeAnonymousImport(
  storage: ProgressStorageAdapter,
  locks: ProgressLockManager | null | undefined,
  ownerUserId: string,
  snapshotHash: string,
  now = new Date(),
): Promise<{ status: "complete" | "unavailable"; anonymousCleared: boolean }> {
  assertOwnerUserId(ownerUserId);
  if (!locks || !HASH_PATTERN.test(snapshotHash)) return { status: "unavailable", anonymousCleared: false };
  try {
    return await locks.request(anonymousImportKey, { mode: "exclusive" }, async () => {
      const claim = await readClaim(storage, now);
      if (!claim || claim.ownerUserId !== ownerUserId || claim.snapshotHash !== snapshotHash) {
        return { status: "unavailable", anonymousCleared: false } as const;
      }
      if (claim.state === "complete") return { status: "complete", anonymousCleared: false } as const;

      let anonymousMatches = false;
      const anonymousRaw = storage.getItem(anonymousProgressKey);
      if (anonymousRaw) {
        try {
          const normalized = normalizeProgress(JSON.parse(anonymousRaw), now);
          anonymousMatches = normalized.status === "ok"
            && await hashProgressSnapshot(normalized.progress, now) === snapshotHash;
        } catch {
          anonymousMatches = false;
        }
      }

      const completed: AnonymousImportClaim = { ownerUserId, state: "complete", snapshotHash };
      if (!writeAndVerify(storage, anonymousImportKey, completed)) {
        return { status: "unavailable", anonymousCleared: false } as const;
      }
      if (anonymousMatches) {
        try {
          storage.setItem(anonymousProgressKey, canonicalProgressJson(canonicalEmptyProgress, now));
          return { status: "complete", anonymousCleared: true } as const;
        } catch {
          return { status: "complete", anonymousCleared: false } as const;
        }
      }
      return { status: "complete", anonymousCleared: false } as const;
    });
  } catch {
    return { status: "unavailable", anonymousCleared: false };
  }
}
