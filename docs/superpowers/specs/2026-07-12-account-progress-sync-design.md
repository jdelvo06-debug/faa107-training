# FAA 107 Account Progress Sync Design

**Date:** 2026-07-12
**Status:** Ready for implementation planning review
**Branch:** `codex/faa107-training-platform`

## Goal

Persist a signed-in learner's FAA 107 course progress in Supabase so lesson completion, quiz attempts, flashcard state, exam attempts, and recent activity follow that learner across devices. Anonymous learners continue using the existing local-first workflow without an account or network dependency. Browser state must remain isolated across accounts, concurrent writes must converge without losing disjoint changes, and a reset must be authoritative across devices.

## Scope and constraints

- Keep authentication additive. No lesson, quiz, flashcard, exam, dashboard, or study-plan route requires login.
- Keep localStorage as the immediate rendering source and offline fallback for every learner.
- Store FAA 107 progress in a new `public.faa107_user_progress` table in the existing shared Supabase project.
- Use the browser's authenticated Supabase session and public client key only. Do not add or use a service-role key.
- Enforce strict owner-only RLS. RPCs derive the target user from `auth.uid()`; the browser never supplies an authoritative `user_id`.
- Do not change course content, payments, Apple Sign In, assessment behavior, or module UX.
- Do not push, merge, deploy, apply a migration, or change the shared Supabase project as part of this design revision.
- Preserve the existing untracked `docs/builder-prompts/auth-supabase-plan.md` file unchanged.

## Architecture

### Storage namespaces and account isolation

Browser progress has exactly one namespace per owner context:

- Anonymous progress: `faa107-progress-v1`
- Authenticated cache: `faa107-progress-v1:<user_id>`
- Authenticated unsynced marker: `faa107-progress-unsynced-v1:<user_id>`
- Anonymous import claim: `faa107-progress-anonymous-import-v1`

The unscoped key is always anonymous and unowned. It is never used as the active cache for an authenticated user. The authenticated key is selected only after the coordinator has captured and validated the active Supabase user ID.

The anonymous key stores normalized `ProgressState` directly for backward compatibility. Every authenticated scoped key instead stores this durable envelope:

```ts
interface AuthenticatedProgressCacheEnvelope {
  envelopeVersion: 1;
  progress: ProgressState;
  resetGeneration: string | null;
  revision: string | null;
  baseProgress: ProgressState | null;
}
```

`resetGeneration` is the UUID from the last canonical row observed by this browser. `revision` is the corresponding non-negative bigint encoded as a decimal string so JavaScript cannot lose precision. `baseProgress` is that revision's normalized canonical progress and is the durable base used to derive an offline delta after restart. `progress` is the latest normalized local rendering state; it may include unsynced changes. A clean cache has `progress` equal to `baseProgress`. A never-synced cache uses null generation, revision, and base until a canonical row is observed.

Local authenticated writes replace only `progress`; they retain the envelope's generation, revision, and base metadata until an RPC response advances the canonical base. An untagged or malformed authenticated cache is unverified legacy data: it may be retained byte-for-byte while remote state is unavailable, but it is never merged or uploaded. Once canonical remote state is available, the coordinator replaces it with a valid envelope rather than guessing a generation.

`lib/progress-storage.ts` remains the only immediate write funnel. Existing write functions synchronously update the active owner context's local cache and dispatch the existing browser progress event, so rendering never waits for Supabase. The storage module also publishes write notifications to the sync coordinator. With no authenticated coordinator, writes stop at the anonymous key exactly as they do today.

Account transitions are fail-closed:

- On sign-out, stop and invalidate the authenticated coordinator before switching the active storage context back to the anonymous key. Do not copy authenticated data into the anonymous key.
- On sign-in, select only the new user's scoped cache. Never inspect or merge any other user's scoped key.
- An in-flight request may finish against its original user's row, but its continuation may not update local state or status after the active user changes.
- If a storage key contains a malformed or non-UUID user suffix, it is ignored; no fallback to the anonymous key occurs while authenticated.

### One-time anonymous-to-first-account import

Anonymous progress may be offered automatically to one account on that browser, once:

1. Before sending any remote request, the coordinator acquires an exclusive Web Lock named `faa107-progress-anonymous-import-v1`, re-reads the claim inside that lock, normalizes the current anonymous progress, and claims that exact snapshot for the first authenticated user by persisting `{ ownerUserId, state: "pending", snapshotHash, snapshot }` in `faa107-progress-anonymous-import-v1`.
2. A claim already owned by another user is never read or imported by the current user. This remains true even if the original import is pending or failed.
3. The stored `snapshot` is the recoverable source of truth for the pending import. Every retry hashes and validates those stored bytes, then merges that exact normalized snapshot with the owner's valid generation-matched scoped cache and remote row. It never re-reads the mutable anonymous key as import input.
4. Only after the RPC returns a canonical row proven to contain the stored claimed snapshot does the coordinator write that canonical state to the owner's scoped envelope and finalize cleanup. It replaces the claim with `{ ownerUserId, state: "complete", snapshotHash }`, removing the stored snapshot bytes only at that point.
5. During cleanup, the coordinator re-reads and normalizes the anonymous key under the same Web Lock. It resets the anonymous key to canonical empty progress only if its hash still equals `snapshotHash`. If another tab changed anonymous progress after the claim, that later anonymous state remains untouched and is not imported by this completed claim.
6. A retry for the same pending owner is idempotent. A completed claim is never imported again, including after sign-out/sign-in or account switching.

If the browser cannot acquire a cross-tab Web Lock or cannot durably persist and verify the claim, automatic import does not begin. Anonymous progress remains untouched and the signed-in account uses only its scoped cache and remote row. This sacrifices automatic import in an unsupported or storage-denied browser rather than risk cross-account contamination.

After a user signs back in, startup reads only `faa107-progress-v1:<that_user_id>` and that user's remote row. It applies the generation gate defined below, restores the resulting canonical state into that same scoped envelope, and never replays anonymous state or another account's cache.

### Pure normalization and merge module

A new `lib/progress-merge.ts` module owns field-level normalization, deterministic merging, retention, and comparison. It is independent of React and Supabase so behavior can be exhaustively unit tested. Equivalent valid inputs always produce byte-equivalent canonical output.

The same canonical rules must be represented by the Postgres commit function for revision-conflict resolution. Client and server fixtures will exercise identical input/output vectors to prevent semantic drift.

### Serialized sync coordinator

A new `lib/progress-sync.ts` module exposes a testable coordinator with injected local-storage, clock, timer, network-state, and Supabase-client dependencies. `AuthProvider` owns one coordinator and routes every startup, local write, reset, retry, visibility/online flush, sign-in, sign-out, token refresh, and account change through one serialized queue.

The coordinator maintains a monotonic in-memory `sessionEpoch`, distinct from the server's reset generation. Every queued job and async continuation captures `{ activeUserId, sessionEpoch }`. Before reading or writing a scoped cache, publishing status, scheduling a retry, or applying an RPC response, the continuation must confirm both values still match. An auth transition increments `sessionEpoch`, cancels timers and abortable requests, drains or invalidates older queued work, switches the storage context, and then starts the new user's startup job.

No debounce callback or promise continuation may call Supabase or local storage outside this queue. This prevents startup, writes, reset, and auth changes from interleaving into a stale owner context.

### Startup and normal writes

Authenticated startup runs in this order:

1. Capture and validate `{ activeUserId, sessionEpoch }`.
2. Read only that user's scoped cache envelope and unsynced marker. Validate the envelope without changing its generation metadata.
3. Fetch that user's canonical remote row, including `revision` and `reset_generation`.
4. If the remote fetch is unavailable, render valid tagged `progress` from the local envelope and retain its `resetGeneration`, `revision`, `baseProgress`, and unsynced marker unchanged. Do not assign a new generation, merge it into any assumed remote state, or upload it until a canonical remote comparison succeeds.
5. If the envelope's non-null `resetGeneration` differs from the canonical remote generation, discard the envelope's `progress` and `baseProgress` completely, clear any marker tied to the stale generation, and replace the envelope with the normalized remote progress, generation, and revision. Do not merge or upload any stale bytes, regardless of whether the old cache was clean or dirty.
6. If the envelope has no verified generation while a remote row exists, treat it as unverified rather than as current-generation data: do not merge or upload it, and replace it with the canonical remote envelope. If the fetch proves no row exists, combine only a valid never-synced envelope and any durable claimed anonymous snapshot into a first-commit candidate with null expected revision/generation and canonical empty `baseProgress`; the locked first-row path below assigns the initial generation.
7. If envelope and remote generations match, normalize and merge local `progress` with canonical remote progress. Use the envelope's `baseProgress` and revision for any pending delta, then persist the resulting same-generation envelope without recursively scheduling a write.
8. If eligible, execute the one-time anonymous import inside this same queued startup job using its durable claimed snapshot.
9. If same-generation merged progress differs from remote state or an unsynced marker exists for that generation, commit through the atomic RPC.

A normal local write updates the UI and the envelope's `progress` immediately, preserves the envelope's generation/revision/base fields, sets the user-scoped unsynced marker before scheduling network work, and enqueues one debounced flush. A flush submits the envelope's last observed remote revision and reset generation, `baseProgress`, and latest normalized `progress`. It never performs a client-side read-then-upsert sequence.

### Atomic concurrency RPC

The only client write path is a narrowly granted security-definer Postgres RPC named `commit_faa107_progress`. Its conceptual signature is:

```sql
commit_faa107_progress(
  expected_revision bigint,
  expected_generation uuid,
  base_progress jsonb,
  proposed_progress jsonb,
  operation_id uuid
)
```

`expected_revision` and `expected_generation` are both nullable only for a first commit after the client observed no row; they must otherwise both be present. The function derives `user_id` from `(select auth.uid())`, validates and normalizes the payload, and first acquires a per-user PostgreSQL advisory transaction lock with `pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended((select auth.uid())::text, 0))`. A hash collision may serialize unrelated users but cannot weaken correctness. Holding this lock through commit serializes the absent-row check and first-row creation, which `SELECT ... FOR UPDATE` alone cannot do. After acquiring it, the function selects that user's row with `FOR UPDATE`. A private operation-receipt table keyed by `(user_id, operation_id)` makes network retries idempotent even if another device commits between the original response and retry. The response always includes `status`, `progress`, `revision`, and `reset_generation` for the latest canonical row visible within the transaction.

Within one transaction:

1. If no row exists after the advisory lock is held, the RPC accepts only null expected revision/generation plus canonical empty `base_progress`, initializes one row with revision 0 and a new reset generation, treats those initialized values as the submitted write's expectations, and applies the first canonical commit before ending the same transaction. No absent row is ever assumed safe merely because a locking SELECT returned no rows.
2. If a racing or delayed first-observation request supplied null expected revision/generation but finds that a preceding lock holder already created the row, the RPC does not merge the null-generation proposal and does not insert an operation receipt. It returns `status = 'first_row_race'` and the current canonical row unchanged. The client keeps its per-user unsynced marker, re-merges its local candidate with that returned canonical row, and retries with a new operation ID using the returned non-null revision and generation. This prevents a delayed null-generation request from bypassing a reset while still preserving a simultaneous contender's progress through the required retry.
3. For every request with a non-null `expected_generation`, if it differs from the locked row's `reset_generation`, the RPC rejects the write with `status = 'generation_mismatch'`. It does not merge or retain the stale proposed payload and returns the current empty-or-newer canonical row.
4. If generation and revision both match, the RPC returns `status = 'current'` without incrementing revision when normalized `proposed_progress` already equals the canonical row; otherwise it stores the proposed progress, increments `revision`, records `operation_id`, and returns `status = 'committed'`.
5. If generation matches but revision differs, the optimistic compare-and-swap is considered conflicted. In the same locked transaction, the RPC derives the submitted delta from `base_progress` to `proposed_progress`, deterministically merges that delta into the current canonical row, applies canonical retention, increments `revision`, records `operation_id`, and returns `status = 'revision_conflict'` plus the newly merged canonical row.
6. A repeated `operation_id` returns `status = 'duplicate'` and the current canonical row without applying the delta or incrementing the revision again. The receipt is inserted in the same transaction as the progress mutation. Receipts are retained for at least 30 days and pruned in bounded batches after that retry window; clients never retry an operation ID after the window expires.

The conflict branch is deliberately server-assisted: merely rejecting stale revision N and asking the losing browser to retry would still lose its update if that browser closed. Because the RPC incorporates the losing write's delta before returning the revision-conflict result, two devices that start at revision N and add disjoint progress converge to a canonical row containing both updates in either commit order, even if the second device closes as soon as it receives its first conflict response.

After a revision-conflict response, the client re-merges the returned canonical row with local changes created after the submitted candidate was captured and retries with the returned revision and generation. If the re-merged state is already represented remotely, the retry is a no-op confirmation that returns `status = 'current'` without incrementing revision. Thus the server preserves the submitted delta if the browser closes before retry, while the normal client retry confirms the conflict was reconciled and preserves any newer local work.

The Postgres implementation must fail the transaction rather than partially normalize unsupported or oversized data. It may call narrowly scoped private helper functions for canonical validation, delta calculation, merge, and retention. Those helpers are not executable by browser roles.

### Retry, offline durability, and lifecycle flushes

The user-scoped unsynced marker is written before a network flush and contains `{ dirty: true, resetGeneration, lastAttemptAt }`; the authenticated cache envelope is the durable payload and canonical-base record. The marker is cleared only when the envelope's latest normalized `progress` is represented in the returned canonical row for the same generation. A clean envelope remains generation-tagged after the marker is cleared.

Transient network, timeout, and 5xx failures retry with exponential backoff of 1, 2, 4, 8, 16, 32, then 60 seconds, each with up to 20 percent jitter. Only one retry timer exists per coordinator. A successful fetch or commit resets the backoff. Authentication/authorization failures pause retries until the next valid auth event. Validation, payload-limit, and unsupported-schema failures are non-retryable and surface a local-only status without overwriting either source.

The browser `online` event enqueues an immediate retry. `visibilitychange` to hidden and `pagehide` enqueue a best-effort, non-blocking flush if the current user is dirty; the request may use fetch keepalive where supported. Correctness never depends on that flush: the persisted marker causes startup or the next online event to retry.

## Progress normalization and canonical retention

### Envelope and schema versions

- Canonical progress is a JSON object with integer `version: 1` and only the recognized top-level fields.
- A missing version is accepted only as legacy version 1 and normalized immediately.
- A non-integer, zero, negative, or malformed version is invalid.
- A version greater than 1 is unsupported, not empty. The client preserves the raw scoped value, does not merge or upload it, and reports that the app must be updated. The server rejects unsupported versions without changing the row.
- The encoded canonical `progress` payload may not exceed 256 KiB. The RPC independently enforces this limit before and after merging.

Malformed top-level collections normalize to empty only for supported version 1. Invalid individual records are dropped. Normalization is field-specific:

- IDs must be lowercase canonical UUID strings for attempts and activity, or known course/module/card/slide IDs for course progress. Arbitrary IDs are limited to 128 UTF-8 bytes before semantic validation.
- Timestamps must be RFC 3339 UTC strings with millisecond precision that parse to a finite instant, no earlier than `2020-01-01T00:00:00.000Z`, and no later than five minutes beyond the server time at commit. Invalid timestamps invalidate the containing record; future-skewed timestamps are clamped only when created locally before commit, never while reading remote data.
- Numeric scores and totals must be finite integers with `0 <= score <= total`, and totals must be within the valid question count for that assessment.
- Human-readable labels are trimmed plain strings of at most 120 UTF-8 bytes. Recent-activity `href` values must be same-origin relative paths matching an existing learner route and are limited to 256 bytes.
- Unknown object keys are stripped. Strings are never interpreted as HTML. `null`, arrays in scalar fields, and non-plain objects are invalid.

### Modules

- Accept only module IDs and slide IDs present in `lib/course-data.ts`.
- Union `visitedSlideIds`, remove duplicates, and sort by course order.
- Recompute `completed`: a module is complete only when every current slide ID for that module has been visited.
- Add optional `updatedAt` to `ModuleProgress`; `markSlideVisited` updates it.
- Choose `lastSlideId` from the newer valid module timestamp when that slide is visited. For legacy records without timestamps, prefer a valid current-owner cache value, then a valid remote value, then the latest visited slide in course order.

### Quiz and exam attempts

- Union records by stable UUID `id`.
- For duplicate IDs, keep the valid record with the later `completedAt`; identical timestamps use the lexicographically smaller canonical JSON encoding as the deterministic tie-breaker.
- Sort by `completedAt` descending, then `id` ascending.
- Retain the newest 30 quiz attempts and newest 10 exam attempts after every local write, client merge, and RPC merge.

### Recent activity

- Union records by stable UUID `id`.
- For duplicate IDs, keep the valid record with the later `at`; identical timestamps use the same canonical-JSON tie-breaker.
- Sort by `at` descending, then `id` ascending.
- Retain the newest 8 records after every local write, client merge, and RPC merge.

The 30/10/8 limits match the current writers and are the single canonical retention rule. Merge never truncates one side before unioning: it unions valid records first, sorts deterministically, then applies the cap. A concurrent record can be omitted only if it falls outside the canonical newest-N window, never because of device commit order.

### Flashcards

`FlashcardProgress` gains an optional per-card review timestamp map. Existing `known` and `unknown` arrays remain the rendered state and remain backward compatible.

- Accept only card IDs belonging to the specified module.
- Preserve every valid card appearing on either device and keep `known` and `unknown` disjoint.
- When both sides agree, retain that state and the newest valid timestamp.
- When sides disagree, use the state with the newer valid per-card review timestamp.
- When only one side has a valid timestamp, use that timestamped state.
- For a legacy conflict with no timestamps, prefer the active owner's current scoped cache during client merge. The server conflict merge uses the submitted delta over unchanged canonical legacy state, so commit order cannot flip an unrelated card.
- `saveFlashcardProgress` stamps only cards whose known/unknown state changed.

## Database and security design

The migration planned after this spec is approved will create:

```sql
create table public.faa107_user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  reset_generation uuid not null,
  updated_at timestamptz not null default now()
);

create table private.faa107_progress_operation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
```

The migration will:

- Explicitly revoke all direct table writes from `anon` and `authenticated`.
- Grant authenticated users only the owner-scoped SELECT needed for startup and Realtime, plus EXECUTE on the two public RPCs.
- Enable RLS and create an authenticated SELECT policy using `(select auth.uid()) = user_id`.
- Define `commit_faa107_progress` and `reset_faa107_progress` as narrowly granted security-definer functions that derive ownership only from `auth.uid()`, reject a missing user, accept no target-user parameter, use a fixed empty `search_path`, and schema-qualify every referenced object.
- Keep the operation receipts and merge/validation helpers in a private schema and revoke all browser-role access. Only the two audited public RPC entry points may reach them.
- Add `faa107_user_progress` to the authenticated Realtime publication for reset propagation; owner-only SELECT RLS remains authoritative for change delivery.
- Set `updated_at` inside the locked RPC transaction. There is no client-controlled timestamp trigger and no DELETE policy because reset never deletes progress.

No policy or function grants cross-user access. No browser code receives elevated credentials or direct INSERT, UPDATE, or DELETE table privileges.

## Reset semantics and propagation

Reset is a distinct queued operation, not a normal progress write. The confirmation copy for a signed-in learner must say: **“Reset progress? This removes saved progress from this account across devices. This cannot be undone.”** Anonymous reset copy may state that it removes progress from this browser.

`reset_faa107_progress(operation_id uuid)` derives the user from `auth.uid()`, acquires the same per-user advisory transaction lock before inspecting the row, and then locks the row. If no row exists, it creates the empty row inside that transaction before applying reset. It writes canonical empty version-1 progress, assigns a new random `reset_generation`, increments `revision`, records the operation ID, and returns the canonical row. It never deletes the row and is idempotent for a repeated operation ID.

The coordinator keeps the reset UI pending until the RPC succeeds. Once it succeeds, it writes an envelope whose `progress` and `baseProgress` are the returned empty canonical progress and whose generation and revision are the returned new values, clears that user's unsynced marker and queued candidate, and publishes the synced state. If the reset request fails, the coordinator retains the pre-reset scoped envelope and reports the failure; it must not present a local reset that could later be silently reversed.

Every normal commit carries the generation captured from its base row. A commit from before reset therefore receives `generation_mismatch`, even if its expected revision would otherwise match. On generation mismatch, the client must:

1. Discard the submitted candidate and all queued data tagged with the old generation.
2. Replace only that user's scoped envelope with the returned canonical progress, generation, revision, and base.
3. Clear that user's old-generation unsynced marker.
4. Re-render the reset state without retrying the stale payload.

Currently open devices subscribe to owner-filtered row changes through Supabase Realtime. A higher revision with a different generation is treated as reset, immediately enqueued through the coordinator, and applies the same stale-queue discard behavior. As fallback for disconnected or suspended tabs, the coordinator re-fetches canonical state on `online`, window focus, visibility becoming visible, token refresh, and periodic retry while dirty. Any later commit from a device that missed the notification is rejected by generation and causes that device to adopt the reset state.

An auth change during reset or any old-user request increments `sessionEpoch`. The request may complete only against the user encoded by its original authenticated JWT and server-side `auth.uid()`, while the stale continuation is forbidden from touching the new user's cache, queue, or status.

## Sync status UX

`AuthContext` exposes a compact progress-sync status for authenticated UI only:

- `Saving progress…` while startup, reset, retry, or a debounced write is active.
- `Progress synced` only after the latest scoped envelope progress is confirmed in the canonical row for the current generation.
- `Saved locally — sync pending` while an unsynced marker exists because the browser is offline or a transient request failed.
- `Update required to sync progress` for an unsupported schema version.

Status appears beside existing account controls with polite live-region behavior. It creates no route-blocking states. Destructive reset uses an explicit confirmation dialog with the required across-devices copy.

The logged-out dashboard prompt truthfully states that logging in syncs progress across devices while local progress works without an account.

## Testing strategy and acceptance criteria

All later behavioral implementation will follow red-green-refactor cycles. Closeout requires the following automated and browser-observable criteria.

### Account isolation and import

- Anonymous progress imports into the first claimed account exactly once and does not import again on reload. After canonical confirmation, cleanup clears the anonymous key only when it still matches the claimed snapshot; a later anonymous mutation remains local and untouched.
- A failed first import remains pinned to its original owner and can be retried only by that owner.
- A pending anonymous import durably stores its exact normalized snapshot. If another tab changes the anonymous key after the first RPC has an ambiguous or failed outcome, retry imports exactly the stored claimed snapshot, does not import the later mutation, and does not clear that later anonymous state during cleanup.
- User A sign-out followed by User B sign-in causes zero reads from A's scoped key and zero import or upload of A's state to B.
- User A signing back in restores only A's scoped cache merged with A's remote row.
- A user switch while an old-user request is pending allows no old continuation to mutate the new user's cache or status; server logs/fixtures prove the request can target only the old user's row.
- Anonymous writes never call Supabase, and storage-denied claim creation skips automatic import without losing anonymous state.

### Atomic and concurrent writes

- RPC tests cover row creation, `first_row_race`, matching revision/generation commit, idempotent operation IDs, revision conflict, generation mismatch, invalid payload, oversized payload, and unauthenticated invocation.
- Two new devices with no existing row race their first disjoint commits simultaneously. The advisory transaction lock serializes creation; the contender receives `first_row_race`, re-merges, and retries with the returned revision/generation. The final single canonical row contains both changes without a uniqueness error, generation bypass, or data loss.
- Two devices start from revision N and the same generation, Device A adds a module completion, and Device B adds a quiz attempt. Committing A then B and B then A both produce one canonical row containing both changes.
- In that test, the device receiving `revision_conflict` closes immediately without a client retry; the returned and persisted canonical server row still contains both disjoint changes.
- A client re-merges every conflict response and retries with the returned revision and generation; the retry is a no-op confirmation when no newer local work exists.
- Retention fixtures prove union-then-sort-then-cap yields the same canonical newest 30 quiz attempts, 10 exam attempts, and 8 activities regardless of input or commit order.

### Reset safety

- Reset racing an in-flight old-generation write leaves the row empty in the new generation; the old write is rejected and cannot recreate progress.
- A delayed null-generation first-observation request that arrives after a row exists, including after reset, receives `first_row_race` and the canonical row unchanged; it cannot merge until the client adopts the returned generation and retries.
- A stale second device writing after reset receives `generation_mismatch`, discards its queued old-generation payload, and adopts empty canonical progress.
- Device A and Device B first hold clean, previously synced generation G1 envelopes. Device A resets to G2 while Device B is offline with no pending write. When Device B restarts, reconnects, and fetches G2, it discards its entire G1 envelope before merging, renders the G2 empty state, and performs no upload that can recreate G1 progress.
- Reload after reset restores empty progress from the same persistent row and generation; no deleted-row recreation path exists.
- A currently open second device receives the generation change and replaces its scoped envelope. A disconnected device does so on its next fetch or rejected commit.
- Reset confirmation uses the exact across-devices destructive copy and reset failure retains the pre-reset local state.
- User B remains untouched when User A's reset or write response completes after an account switch.

### Coordinator, failure, and normalization behavior

- Deterministic queue tests cover startup plus local write, write plus reset, retry plus sign-out, token refresh, rapid A-to-B account switch, visibility flush, and online retry without interleaving owner contexts.
- Every async continuation test demonstrates both active user ID and `sessionEpoch` validation.
- Transient failures persist the per-user unsynced marker, follow the bounded jittered backoff, retry immediately online, and resume after reload.
- `pagehide` and hidden-visibility flushes are best effort; a simulated dropped flush still syncs from the persisted marker on next startup.
- Field-level fixtures cover malformed collections, invalid UUIDs/course IDs/timestamps/scores/routes, unknown keys, deterministic timestamp ties, payload limits, and canonical byte stability.
- A future schema version is preserved and blocked from merge/upload rather than normalized to empty or overwritten.
- Client and Postgres merge fixtures produce identical canonical results for normal, conflicting, capped, and legacy inputs.

### Security and browser proof

- Migration tests inspect the table, foreign key, revision, reset generation, owner SELECT policy, revoked direct writes, RPC grants, fixed search paths, private helpers, per-user advisory transaction lock before absent-row inspection, and absence of DELETE access.
- Live verification in a later implementation phase proves anonymous access is denied and two authenticated users cannot read or change each other's rows or invoke an RPC against another user ID.
- Same-user clean-context browser proof restores module and quiz progress from the remote row.
- Same-browser A-to-B-to-A proof demonstrates zero cross-account contamination and correct A restoration.
- Two-browser concurrent proof demonstrates disjoint-write convergence, and reset proof demonstrates propagation plus stale-device rejection.
- Logged-out clean-context proof confirms anonymous progress persists locally without a remote request.

Browser proof is not production deployment proof. The implementation closeout must distinguish local working-tree truth, local committed truth, shared-database truth, pushed truth, and deployed/live truth.

## Verification and closeout

Before any later implementation commit, run and inspect:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Implementation closeout must report:

- Migration and RPC names, changed files, exact grants/RLS behavior, and confirmation that no service-role key exists in client or server code.
- The client/server canonical merge fixture results, simultaneous first-row creation proof, and explicit two-device revision-conflict proof.
- Durable anonymous-snapshot retry, A-to-B-to-A isolation, old-request account-switch, offline clean-cache generation mismatch, reset race, stale-device, reload, and open-device propagation results.
- Retry/backoff, persisted unsynced marker, online recovery, lifecycle-flush fallback, unsupported-version, payload-limit, and retention-cap results.
- Full test, lint, type-check, build, and `git diff --check` output.
- Browser evidence and the exact state of any migration, push, merge, or deployment.
- Remaining caveats, with local committed truth, shared-database truth, and deployed/live truth kept separate.
