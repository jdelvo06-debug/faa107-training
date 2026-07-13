import type { User } from "@supabase/supabase-js";
import {
  anonymousImportKey,
  claimAnonymousProgress,
  classifyAuthenticatedEnvelope,
  clearUnsyncedMarker,
  completeAnonymousImport,
  createNeverSyncedEnvelope,
  readAuthenticatedCache,
  readUnsyncedMarker,
  writeAuthenticatedCache,
  writeUnsyncedMarker,
  type ProgressLockManager,
  type ProgressStorageAdapter,
} from "@/lib/progress-cache";
import {
  applyProgressDelta,
  canonicalEmptyProgress,
  canonicalProgressJson,
  deriveProgressDelta,
  mergeProgress,
} from "@/lib/progress-merge";
import {
  ProgressRpcError,
  type ProgressRemoteRow,
  type ProgressRpcAdapter,
  type ProgressCommitInput,
} from "@/lib/progress-rpc";
import type { AnonymousImportClaim, AuthenticatedProgressCacheEnvelope, ProgressState } from "@/lib/types";

export type ProgressSyncStatus = "idle" | "saving" | "synced" | "local-only" | "update-required";

export interface ProgressSyncSnapshot {
  status: ProgressSyncStatus;
  userId: string | null;
  message: string | null;
}

export interface ProgressSyncCoordinator {
  authChanged(user: User | null): Promise<void>;
  authTokenChanged(token: string): Promise<void>;
  localWrite(): void;
  reset(): Promise<void>;
  flush(reason: "debounce" | "online" | "foreground" | "visibility" | "pagehide"): Promise<void>;
  subscribe(listener: (snapshot: ProgressSyncSnapshot) => void): () => void;
  dispose(): void;
}

export interface ProgressSyncDependencies {
  rpc: ProgressRpcAdapter;
  storage: ProgressStorageAdapter;
  locks?: ProgressLockManager | null;
  now?: () => Date;
  random?: () => number;
  randomUuid?: () => string;
  isOnline?: () => boolean;
  setTimeout?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout?: (timer: ReturnType<typeof setTimeout>) => void;
  setProgressOwner: (userId: string | null) => void;
  notifyProgress?: () => void;
}

type OwnerContext = { userId: string; epoch: number };
type TimerHandle = ReturnType<typeof setTimeout>;

const RETRY_SECONDS = [1, 2, 4, 8, 16, 32, 60] as const;

function sameProgress(left: ProgressState, right: ProgressState, now: Date): boolean {
  return canonicalProgressJson(left, now) === canonicalProgressJson(right, now);
}

function taggedEnvelope(row: ProgressRemoteRow, progress = row.progress): AuthenticatedProgressCacheEnvelope {
  return {
    envelopeVersion: 1,
    progress,
    resetGeneration: row.resetGeneration,
    resetEpoch: row.resetEpoch,
    revision: row.revision,
    baseProgress: row.progress,
  };
}

function compareDecimal(left: string, right: string): number {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  return left < right ? -1 : left > right ? 1 : 0;
}

function errorKind(error: unknown): "auth" | "transient" | "validation" | "unsupported" {
  if (error instanceof ProgressRpcError) return error.kind;
  if (error && typeof error === "object" && "kind" in error) {
    const kind = (error as { kind?: unknown }).kind;
    if (kind === "auth" || kind === "validation" || kind === "unsupported") return kind;
  }
  return "transient";
}

export function createProgressSyncCoordinator(dependencies: ProgressSyncDependencies): ProgressSyncCoordinator {
  const now = dependencies.now ?? (() => new Date());
  const random = dependencies.random ?? Math.random;
  const randomUuid = dependencies.randomUuid ?? (() => crypto.randomUUID());
  const isOnline = dependencies.isOnline ?? (() => typeof navigator === "undefined" || navigator.onLine);
  const scheduleTimeout = dependencies.setTimeout ?? ((callback, delay) => setTimeout(callback, delay));
  const cancelTimeout = dependencies.clearTimeout ?? ((timer) => clearTimeout(timer));
  const listeners = new Set<(snapshot: ProgressSyncSnapshot) => void>();

  let snapshot: ProgressSyncSnapshot = { status: "idle", userId: null, message: null };
  let queue: Promise<void> = Promise.resolve();
  let activeUserId: string | null = null;
  let desiredUserId: string | null = null;
  let sessionEpoch = 0;
  let retryIndex = 0;
  let retryTimer: TimerHandle | null = null;
  let debounceTimer: TimerHandle | null = null;
  let removeRealtime: (() => void) | null = null;
  let activeAbort: AbortController | null = null;
  let pendingResetOperationId: string | null = null;
  let pendingCommit: {
    context: OwnerContext;
    input: ProgressCommitInput;
    envelope: AuthenticatedProgressCacheEnvelope;
  } | null = null;
  let blockedContext: OwnerContext | null = null;
  let transitionWrite: {
    context: OwnerContext;
    base: ProgressState;
    proposed: ProgressState;
  } | null = null;
  let disposed = false;

  function current(context: OwnerContext): boolean {
    return !disposed && activeUserId === context.userId && sessionEpoch === context.epoch;
  }

  function isBlocked(context: OwnerContext): boolean {
    return blockedContext?.userId === context.userId && blockedContext.epoch === context.epoch;
  }

  function publish(context: OwnerContext | null, status: ProgressSyncStatus, message: string | null): void {
    if (context && !current(context)) return;
    snapshot = { status, userId: context?.userId ?? null, message };
    listeners.forEach((listener) => listener(snapshot));
  }

  function notify(context: OwnerContext): void {
    if (current(context)) dependencies.notifyProgress?.();
  }

  async function retireAnonymousClaim(
    context: OwnerContext,
    claim: AnonymousImportClaim,
  ): Promise<boolean> {
    if (!dependencies.locks) return false;
    try {
      return await dependencies.locks.request(anonymousImportKey, { mode: "exclusive" }, () => {
        if (!current(context)) return false;
        const raw = dependencies.storage.getItem(anonymousImportKey);
        if (!raw) return false;
        const stored = JSON.parse(raw) as Partial<AnonymousImportClaim>;
        if (stored.ownerUserId !== context.userId || stored.snapshotHash !== claim.snapshotHash) return false;
        const completed: AnonymousImportClaim = {
          ownerUserId: context.userId,
          state: "complete",
          snapshotHash: claim.snapshotHash,
        };
        const encoded = JSON.stringify(completed);
        dependencies.storage.setItem(anonymousImportKey, encoded);
        return dependencies.storage.getItem(anonymousImportKey) === encoded;
      });
    } catch {
      return false;
    }
  }

  function enqueue(job: () => Promise<void> | void): Promise<void> {
    const run = queue.then(job, job);
    queue = run.catch(() => {});
    return run;
  }

  function clearTimer(kind: "retry" | "debounce"): void {
    const timer = kind === "retry" ? retryTimer : debounceTimer;
    if (timer !== null) cancelTimeout(timer);
    if (kind === "retry") retryTimer = null;
    else debounceTimer = null;
  }

  function clearAllTimers(): void {
    clearTimer("retry");
    clearTimer("debounce");
  }

  function resetBackoff(): void {
    retryIndex = 0;
    clearTimer("retry");
  }

  async function abortable<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    activeAbort = controller;
    try {
      return await request(controller.signal);
    } finally {
      if (activeAbort === controller) activeAbort = null;
    }
  }

  function scheduleRetry(context: OwnerContext): void {
    if (!current(context) || retryTimer !== null) return;
    const seconds = RETRY_SECONDS[Math.min(retryIndex, RETRY_SECONDS.length - 1)];
    retryIndex = Math.min(retryIndex + 1, RETRY_SECONDS.length - 1);
    const jitter = 0.8 + random() * 0.4;
    retryTimer = scheduleTimeout(() => {
      retryTimer = null;
      if (current(context)) void flush("debounce").catch(() => {});
    }, Math.round(seconds * 1000 * jitter));
  }

  function adopt(context: OwnerContext, row: ProgressRemoteRow, clean = true): void {
    if (!current(context)) return;
    writeAuthenticatedCache(dependencies.storage, context.userId, taggedEnvelope(row), now());
    if (clean) clearUnsyncedMarker(dependencies.storage, context.userId);
    notify(context);
  }

  function subscribeRealtime(context: OwnerContext): void {
    removeRealtime?.();
    removeRealtime = dependencies.rpc.subscribe(context.userId, (remote) => {
      void enqueue(() => handleRealtime(context, remote));
    });
  }

  function discardSupersededWork(): void {
    pendingResetOperationId = null;
    pendingCommit = null;
    transitionWrite = null;
    blockedContext = null;
    clearAllTimers();
  }

  async function handleRealtime(context: OwnerContext, remote: ProgressRemoteRow): Promise<void> {
    if (!current(context)) return;
    const cached = readAuthenticatedCache(dependencies.storage, context.userId, now());
    if (cached.status !== "ok") {
      adopt(context, remote);
      publish(context, "synced", null);
      return;
    }
    const localGeneration = cached.envelope.resetGeneration;
    const localEpoch = cached.envelope.resetEpoch;
    const localRevision = cached.envelope.revision;
    const marker = readUnsyncedMarker(dependencies.storage, context.userId);
    if (localGeneration === null && marker) {
      if (remote.resetEpoch === "0") {
        const merged = mergeProgress(cached.envelope.progress, remote.progress, now());
        writeAuthenticatedCache(dependencies.storage, context.userId, taggedEnvelope(remote, merged), now());
        writeUnsyncedMarker(dependencies.storage, context.userId, {
          dirty: true,
          resetGeneration: remote.resetGeneration,
          lastAttemptAt: marker.lastAttemptAt,
        });
        notify(context);
        await commitCurrent(context);
      } else {
        discardSupersededWork();
        adopt(context, remote);
        publish(context, "synced", null);
      }
      return;
    }
    if (localGeneration !== remote.resetGeneration || localEpoch !== remote.resetEpoch) {
      if (localRevision === null || compareDecimal(remote.revision, localRevision) > 0) {
        discardSupersededWork();
        adopt(context, remote);
        resetBackoff();
        publish(context, "synced", null);
      }
      return;
    }
    if (localRevision !== null && compareDecimal(remote.revision, localRevision) <= 0) return;
    if (!marker) {
      adopt(context, remote);
      publish(context, "synced", null);
      return;
    }
    const merged = mergeProgress(cached.envelope.progress, remote.progress, now());
    writeAuthenticatedCache(dependencies.storage, context.userId, taggedEnvelope(remote, merged), now());
    notify(context);
    await commitCurrent(context);
  }

  async function handleRequestFailure(context: OwnerContext, error: unknown): Promise<void> {
    if (!current(context)) return;
    const kind = errorKind(error);
    if (kind === "unsupported") {
      publish(context, "update-required", "Update required to sync progress");
      return;
    }
    if (kind === "validation") {
      publish(context, "local-only", "Saved locally — progress could not be synced");
      return;
    }
    if (kind === "auth") {
      publish(context, "local-only", "Saved locally — sign in again to sync");
      return;
    }
    publish(context, "local-only", "Saved locally — sync pending");
    scheduleRetry(context);
  }

  async function commitCurrent(context: OwnerContext, importClaim?: AnonymousImportClaim): Promise<void> {
    if (isBlocked(context)) return;
    let attempts = 0;
    while (current(context) && attempts < 8) {
      attempts += 1;
      const cached = readAuthenticatedCache(dependencies.storage, context.userId, now());
      if (cached.status === "unsupported") {
        publish(context, "update-required", "Update required to sync progress");
        return;
      }
      if (cached.status !== "ok") {
        publish(context, "local-only", "Saved locally — progress cache is unavailable");
        return;
      }
      const reusable = pendingCommit
        && pendingCommit.context.userId === context.userId
        && pendingCommit.context.epoch === context.epoch
        ? pendingCommit
        : null;
      const submitted = reusable?.envelope ?? cached.envelope;
      const input = reusable?.input ?? {
        expectedRevision: submitted.revision,
        expectedGeneration: submitted.resetGeneration,
        baseProgress: submitted.baseProgress ?? canonicalEmptyProgress,
        proposedProgress: submitted.progress,
        operationId: randomUuid(),
      };
      pendingCommit = { context, input, envelope: submitted };
      writeUnsyncedMarker(dependencies.storage, context.userId, {
        dirty: true,
        resetGeneration: submitted.resetGeneration,
        lastAttemptAt: now().toISOString(),
      });
      if (!isOnline()) {
        publish(context, "local-only", "Saved locally — sync pending");
        scheduleRetry(context);
        return;
      }
      publish(context, "saving", null);
      let response;
      try {
        response = await abortable((signal) => dependencies.rpc.commit(input, signal));
      } catch (error) {
        const kind = errorKind(error);
        if (kind === "validation" || kind === "unsupported") {
          pendingCommit = null;
          blockedContext = context;
        }
        await handleRequestFailure(context, error);
        return;
      }
      if (!current(context)) return;
      pendingCommit = null;
      blockedContext = null;
      resetBackoff();

      const responseResetOccurred = submitted.resetGeneration === null
        ? response.resetEpoch !== "0"
        : response.resetGeneration !== submitted.resetGeneration
          || response.resetEpoch !== submitted.resetEpoch;
      if (responseResetOccurred) {
        if (importClaim) {
          await retireAnonymousClaim(context, importClaim);
          if (!current(context)) return;
        }
        adopt(context, response);
        publish(context, "synced", null);
        return;
      }

      if (response.status === "pre_generation_rejected" || response.status === "generation_mismatch") {
        adopt(context, response);
        publish(context, "synced", null);
        return;
      }

      if (response.status === "first_row_race") {
        const latest = readAuthenticatedCache(dependencies.storage, context.userId, now());
        const latestCandidate = latest.status === "ok" ? latest.envelope.progress : submitted.progress;
        const merged = mergeProgress(latestCandidate, response.progress, now());
        writeAuthenticatedCache(dependencies.storage, context.userId, taggedEnvelope(response, merged), now());
        writeUnsyncedMarker(dependencies.storage, context.userId, {
          dirty: true,
          resetGeneration: response.resetGeneration,
          lastAttemptAt: now().toISOString(),
        });
        continue;
      }

      const latest = readAuthenticatedCache(dependencies.storage, context.userId, now());
      const latestProgress = latest.status === "ok" ? latest.envelope.progress : submitted.progress;
      const reconciled = mergeProgress(response.progress, latestProgress, now());
      const needsConfirmation = response.status === "revision_conflict"
        || !sameProgress(reconciled, response.progress, now());
      writeAuthenticatedCache(dependencies.storage, context.userId, taggedEnvelope(response, reconciled), now());
      notify(context);
      if (needsConfirmation) {
        writeUnsyncedMarker(dependencies.storage, context.userId, {
          dirty: true,
          resetGeneration: response.resetGeneration,
          lastAttemptAt: now().toISOString(),
        });
        continue;
      }
      clearUnsyncedMarker(dependencies.storage, context.userId);
      if (importClaim) {
        await completeAnonymousImport(
          dependencies.storage,
          dependencies.locks,
          context.userId,
          importClaim.snapshotHash,
          now(),
        );
        if (!current(context)) return;
      }
      publish(context, "synced", null);
      return;
    }
    if (current(context)) {
      publish(context, "local-only", "Saved locally — sync pending");
      scheduleRetry(context);
    }
  }

  async function startup(context: OwnerContext): Promise<void> {
    if (!current(context)) return;
    publish(context, "saving", null);
    const initialCache = readAuthenticatedCache(dependencies.storage, context.userId, now());
    if (initialCache.status === "unsupported") {
      blockedContext = context;
      publish(context, "update-required", "Update required to sync progress");
      return;
    }
    const claim = await claimAnonymousProgress(
      dependencies.storage,
      dependencies.locks,
      context.userId,
      now(),
    );
    if (!current(context)) return;
    const importClaim = (claim.status === "claimed" || claim.status === "pending") && claim.claim.snapshot
      ? claim.claim
      : undefined;
    let fetched;
    try {
      fetched = await abortable((signal) => dependencies.rpc.fetch(context.userId, signal));
    } catch (error) {
      if (!current(context)) return;
      const kind = errorKind(error);
      if (kind === "validation" || kind === "unsupported") blockedContext = context;
      await handleRequestFailure(context, error);
      return;
    }
    if (!current(context)) return;
    resetBackoff();
    subscribeRealtime(context);
    const cached = readAuthenticatedCache(dependencies.storage, context.userId, now());
    const marker = readUnsyncedMarker(dependencies.storage, context.userId);
    if (cached.status === "unsupported") {
      publish(context, "update-required", "Update required to sync progress");
      return;
    }

    if (fetched.status === "missing") {
      const transition = transitionWrite
        && transitionWrite.context.userId === context.userId
        && transitionWrite.context.epoch === context.epoch
        && !sameProgress(transitionWrite.base, transitionWrite.proposed, now())
        ? transitionWrite
        : null;
      if (cached.status === "invalid"
        || (cached.status === "ok" && cached.envelope.resetGeneration !== null && !transition)) {
        publish(context, "local-only", "Saved locally — canonical progress row is unavailable");
        return;
      }
      let candidate = cached.status === "ok" && cached.envelope.resetGeneration === null
        ? cached.envelope.progress
        : canonicalEmptyProgress;
      if (transition) {
        candidate = applyProgressDelta(
          candidate,
          deriveProgressDelta(transition.base, transition.proposed, now()),
          now(),
        );
      }
      if (importClaim?.snapshot) candidate = mergeProgress(candidate, importClaim.snapshot, now());
      writeAuthenticatedCache(
        dependencies.storage,
        context.userId,
        createNeverSyncedEnvelope(candidate, now()),
        now(),
      );
      writeUnsyncedMarker(dependencies.storage, context.userId, {
        dirty: true,
        resetGeneration: null,
        lastAttemptAt: null,
      });
      notify(context);
      transitionWrite = null;
      await commitCurrent(context, importClaim);
      return;
    }

    let merged = fetched.row.progress;
    if (cached.status === "ok") {
      const classification = classifyAuthenticatedEnvelope(
        cached.envelope,
        fetched.row.resetGeneration,
        fetched.row.resetEpoch,
      );
      if (classification === "current") {
        merged = mergeProgress(cached.envelope.progress, fetched.row.progress, now());
      }
    }
    if (importClaim?.snapshot) merged = mergeProgress(merged, importClaim.snapshot, now());
    const transition = transitionWrite
      && transitionWrite.context.userId === context.userId
      && transitionWrite.context.epoch === context.epoch
      && !sameProgress(transitionWrite.base, transitionWrite.proposed, now())
      ? transitionWrite
      : null;
    if (transition) {
      merged = applyProgressDelta(
        merged,
        deriveProgressDelta(transition.base, transition.proposed, now()),
        now(),
      );
    }
    writeAuthenticatedCache(dependencies.storage, context.userId, taggedEnvelope(fetched.row, merged), now());
    transitionWrite = null;
    notify(context);
    if (importClaim || marker || !sameProgress(merged, fetched.row.progress, now())) {
      writeUnsyncedMarker(dependencies.storage, context.userId, {
        dirty: true,
        resetGeneration: fetched.row.resetGeneration,
        lastAttemptAt: marker?.lastAttemptAt ?? null,
      });
      await commitCurrent(context, importClaim);
    } else {
      clearUnsyncedMarker(dependencies.storage, context.userId);
      publish(context, "synced", null);
    }
  }

  async function performReset(context: OwnerContext, operationId: string): Promise<void> {
    if (!current(context)) return;
    publish(context, "saving", null);
    try {
      const response = await abortable((signal) => dependencies.rpc.reset({ operationId }, signal));
      if (!current(context)) return;
      if (pendingResetOperationId === operationId) pendingResetOperationId = null;
      pendingCommit = null;
      blockedContext = null;
      resetBackoff();
      adopt(context, response);
      publish(context, "synced", null);
    } catch (error) {
      const kind = errorKind(error);
      if (kind === "validation" || kind === "unsupported") {
        if (pendingResetOperationId === operationId) pendingResetOperationId = null;
        blockedContext = context;
      }
      if (current(context)) await handleRequestFailure(context, error);
      throw error;
    }
  }

  async function flush(reason: "debounce" | "online" | "foreground" | "visibility" | "pagehide"): Promise<void> {
    clearTimer("debounce");
    if (reason === "online") clearTimer("retry");
    const context = activeUserId ? { userId: activeUserId, epoch: sessionEpoch } : null;
    if (!context) return queue;
    return enqueue(async () => {
      if (!current(context)) return;
      if (isBlocked(context)) return;
      if (pendingResetOperationId) {
        await performReset(context, pendingResetOperationId);
        return;
      }
      if (reason === "online" || reason === "foreground") {
        await startup(context);
        return;
      }
      if (readUnsyncedMarker(dependencies.storage, context.userId)) await commitCurrent(context);
    });
  }

  return {
    authChanged(user) {
      const nextUserId = user?.id ?? null;
      if (nextUserId === desiredUserId && activeUserId === nextUserId) return queue;
      desiredUserId = nextUserId;
      sessionEpoch += 1;
      const epoch = sessionEpoch;
      activeUserId = null;
      dependencies.setProgressOwner(nextUserId);
      dependencies.notifyProgress?.();
      activeAbort?.abort();
      activeAbort = null;
      clearAllTimers();
      removeRealtime?.();
      removeRealtime = null;
      pendingResetOperationId = null;
      pendingCommit = null;
      blockedContext = null;
      const selectedCache = nextUserId
        ? readAuthenticatedCache(dependencies.storage, nextUserId, now())
        : null;
      const transitionBase = selectedCache?.status === "ok"
        ? selectedCache.envelope.progress
        : canonicalEmptyProgress;
      transitionWrite = nextUserId
        ? { context: { userId: nextUserId, epoch }, base: transitionBase, proposed: transitionBase }
        : null;
      return enqueue(async () => {
        if (disposed || epoch !== sessionEpoch || desiredUserId !== nextUserId) return;
        activeUserId = nextUserId;
        if (!nextUserId) {
          publish(null, "idle", null);
          return;
        }
        await startup({ userId: nextUserId, epoch });
      });
    },

    authTokenChanged(token) {
      const userId = desiredUserId;
      const context = userId ? { userId, epoch: sessionEpoch } : null;
      return enqueue(async () => {
        if (!context || !current(context)) return;
        await dependencies.rpc.refreshRealtimeAuth(token);
        if (!current(context)) return;
        if (isBlocked(context)) return;
        if (pendingResetOperationId) {
          await performReset(context, pendingResetOperationId);
          return;
        }
        await startup(context);
      });
    },

    localWrite() {
      const ownerUserId = activeUserId ?? desiredUserId;
      if (!ownerUserId || disposed) return;
      const context = { userId: ownerUserId, epoch: sessionEpoch };
      blockedContext = null;
      const cached = readAuthenticatedCache(dependencies.storage, context.userId, now());
      if (cached.status !== "ok") return;
      if (transitionWrite
        && transitionWrite.context.userId === context.userId
        && transitionWrite.context.epoch === context.epoch) {
        transitionWrite = { ...transitionWrite, proposed: cached.envelope.progress };
      }
      writeUnsyncedMarker(dependencies.storage, context.userId, {
        dirty: true,
        resetGeneration: cached.envelope.resetGeneration,
        lastAttemptAt: null,
      });
      if (activeUserId === ownerUserId) {
        publish(context, "saving", null);
      } else if (desiredUserId === ownerUserId && sessionEpoch === context.epoch) {
        snapshot = { status: "saving", userId: ownerUserId, message: null };
        listeners.forEach((listener) => listener(snapshot));
        return;
      }
      clearTimer("debounce");
      debounceTimer = scheduleTimeout(() => {
        debounceTimer = null;
        if (current(context)) void flush("debounce");
      }, 750);
    },

    reset() {
      const context = activeUserId ? { userId: activeUserId, epoch: sessionEpoch } : null;
      if (!context) return Promise.resolve();
      blockedContext = null;
      const operationId = pendingResetOperationId ?? randomUuid();
      pendingResetOperationId = operationId;
      return enqueue(() => performReset(context, operationId));
    },

    flush,

    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      return () => listeners.delete(listener);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      sessionEpoch += 1;
      activeAbort?.abort();
      activeAbort = null;
      clearAllTimers();
      removeRealtime?.();
      removeRealtime = null;
      activeUserId = null;
      desiredUserId = null;
      pendingResetOperationId = null;
      pendingCommit = null;
      blockedContext = null;
      transitionWrite = null;
      dependencies.setProgressOwner(null);
      listeners.clear();
    },
  };
}
