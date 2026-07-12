# FAA 107 Account Progress Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure, local-first, account-backed FAA 107 progress synchronization that isolates browser accounts, converges concurrent writes, and prevents reset resurrection.

**Architecture:** Keep `lib/progress-storage.ts` as the synchronous UI write funnel, add pure canonical model/cache modules, and serialize authenticated work through one coordinator. All remote mutations go through owner-derived, security-definer PostgreSQL RPCs protected by a per-user advisory transaction lock, revision/generation checks, durable reset epochs, and operation receipts. Anonymous use remains independent of Supabase.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5.9, `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.110, PostgreSQL/Supabase RLS and Realtime Postgres Changes, Node test runner, Playwright, Supabase CLI and local stack.

## Global Constraints

- Authoritative design: `docs/superpowers/specs/2026-07-12-account-progress-sync-design.md` at commit `282ec9d7ae8c94c5b213b79998fae4619827c5a5`.
- Authentication remains additive; every course route must work without login.
- Rendering and learner writes remain local-first; network work never blocks course use.
- Use only the authenticated browser session and public client key. Never add a service-role or secret key.
- RPCs derive the owner from `(select auth.uid())`; no client-supplied target user ID is accepted.
- Keep direct table writes revoked from `anon` and `authenticated`; grant authenticated SELECT only for owner-scoped startup/Realtime plus EXECUTE on the two RPCs.
- Do not change payments, Apple Sign In, course content, assessment behavior, module UX, or active-exam persistence.
- Canonical retention is union, deterministic sort, then cap: 30 quiz attempts, 10 exam attempts, and 8 recent-activity records.
- Signed-in reset confirmation is exactly: “Reset progress? This removes saved progress from this account across devices. This cannot be undone.”
- No shared-Supabase migration may be applied without Jeremy's explicit approval at Gate A below.
- Push, merge, and deploy are separate approval boundaries and are not authorized by this plan.
- Preserve the existing untracked `docs/builder-prompts/auth-supabase-plan.md` unchanged.

## Dependencies and preflight

- Current repository baseline must still be branch `codex/faa107-training-platform` with approved spec commit `282ec9d` in its ancestry.
- The repository currently has no `supabase/` directory. Create it during execution with the Supabase CLI; do not connect it to or reset the shared project during local work.
- Planned migration path: `supabase/migrations/20260712000000_account_progress_sync.sql`. Create the migration with `supabase migration new account_progress_sync`; if the CLI-generated timestamp differs, use that generated path consistently and record it in closeout rather than hand-creating a second migration.
- Discover the installed CLI before using it: `supabase --version`, `supabase --help`, `supabase migration --help`, `supabase test --help`, and `supabase db --help`. Stop if required commands are unavailable; do not guess flags.
- Local database verification requires Docker and a local Supabase stack only. Shared-project identifiers, credentials, and test-user credentials remain outside git.
- Official Supabase guidance checked for this plan: explicit Data API grants are now required for new tables; RLS and grants are separate controls; security-definer functions require explicit identity checks, fixed search paths, and revoked default EXECUTE; Postgres Changes requires publication membership and respects SELECT RLS.

## Assumptions

- Docker and a current Supabase CLI are available during execution; if either is unavailable, local database phases stop rather than substituting the shared project.
- The existing shared Supabase project continues to host FAA 107 authentication, but no schema object for FAA progress exists yet. Verify this read-only before Gate A; a name collision stops execution.
- Jeremy can provide or approve two non-production learner test accounts for Gate B. `tests/account-progress-sync-browser.test.cjs` reads `FAA107_E2E_USER_A_EMAIL`, `FAA107_E2E_USER_A_PASSWORD`, `FAA107_E2E_USER_B_EMAIL`, `FAA107_E2E_USER_B_PASSWORD`, and optional `FAA107_E2E_BASE_URL` (default `http://127.0.0.1:3000`) from an ignored local environment file; values never enter fixtures, logs, screenshots, or commits.
- Progress updates are low-frequency and one-row-per-user, so owner-filtered Realtime Postgres Changes is sufficient for reset acceleration. Correctness remains fetch/RPC-based; no Broadcast redesign is included.
- The current Node test-runner/transpile pattern remains the project convention; adding Jest, Vitest, an ORM, or a second migration framework is out of scope.
- `faa107-active-exam-v1` remains device-local and outside account sync.
- The fixed migration path is the review target. If `supabase migration new account_progress_sync` generates a different timestamp, that single CLI-created file replaces the planned timestamp everywhere; do not maintain duplicate migration files.

## Planned file map

**Create**

- `supabase/migrations/20260712000000_account_progress_sync.sql` — schema, grants, RLS, private helpers, RPCs, publication membership.
- `supabase/tests/account_progress_sync.sql` — local database schema, privilege, RLS, concurrency, idempotency, and reset tests.
- `lib/progress-merge.ts` — pure normalization, canonical encoding, delta, merge, comparison, and retention.
- `lib/progress-cache.ts` — anonymous/scoped keys, authenticated envelope, import claim, durable marker, and storage adapter.
- `lib/progress-rpc.ts` — typed Supabase SELECT/RPC/Realtime adapter; no policy or merge decisions.
- `lib/progress-sync.ts` — serialized coordinator and lifecycle/retry state machine.
- `tests/fixtures/progress-canonical-cases.json` — shared canonical input/output vectors.
- `tests/progress-merge.test.cjs` — pure normalization/merge/retention tests.
- `tests/progress-cache.test.cjs` — namespace, envelope, import, and storage-denied tests.
- `tests/progress-rpc-contract.test.cjs` — migration/RPC contract and browser-key-only assertions.
- `tests/progress-rpc-integration.test.cjs` — local Supabase RPC and fixture-parity runner.
- `tests/progress-sync.test.cjs` — coordinator, auth, retry, race, and reset state-machine tests.
- `tests/account-progress-sync-browser.test.cjs` — Playwright proof lanes using public authenticated sessions.

**Modify**

- `lib/types.ts` — timestamp metadata and sync/cache/RPC types.
- `lib/progress-storage.ts` — delegate owner-context persistence while preserving synchronous API behavior.
- `components/auth-provider.tsx` — own coordinator lifecycle and expose sync/reset status.
- `components/modern-flight-school-shell.tsx` — render truthful authenticated sync status.
- `components/dashboard-summary.tsx` — coordinated reset confirmation and final logged-out copy.
- `components/modern-flight-school.module.css` — minimal status/confirmation styling only.
- `tests/supabase-auth.test.cjs` — additive auth/public-key/non-gating assertions.
- `docs/supabase-auth-configuration.md` — progress-sync configuration and truthful migration state after approval.
- `README.md` and `SESSION.md` — update only during implementation closeout with verified state.

---

## Phase 1: Database and security foundation

### Objective

Author and locally verify the complete database boundary without applying it to the shared Supabase project.

### Exact files and schema objects

- Create `supabase/migrations/20260712000000_account_progress_sync.sql`.
- Create `supabase/tests/account_progress_sync.sql`.
- Create schemas/objects: `public.faa107_user_progress`, `private.faa107_progress_operation_receipts`, `private.faa107_normalize_progress`, `private.faa107_progress_delta`, `private.faa107_merge_progress`, `private.faa107_prune_operation_receipts`, `public.commit_faa107_progress`, and `public.reset_faa107_progress`.

### Ordered tasks

- [ ] **1.1 Establish local Supabase tooling.** Run the CLI discovery commands, initialize local configuration if absent, start only the local stack, and record versions in the implementation log. Expected: no remote project is linked and `git status` shows only local configuration/migration/test files.
- [ ] **1.2 Write failing schema/security tests first.** In `supabase/tests/account_progress_sync.sql`, assert table columns/types/checks, both primary keys, FK cascades, RLS enabled, no DELETE policy, owner-only SELECT, revoked direct writes, revoked `PUBLIC`/`anon` function EXECUTE, fixed empty search paths, private-helper isolation, and `auth.uid()`-derived ownership.
- [ ] **1.3 Author the migration skeleton.** Define `faa107_user_progress(user_id uuid primary key references auth.users(id) on delete cascade, progress jsonb not null, revision bigint not null default 0 check (revision >= 0), reset_generation uuid not null, reset_epoch bigint not null default 0 check (reset_epoch >= 0), updated_at timestamptz not null default now())` and the private receipt table keyed by `(user_id, operation_id)`.
- [ ] **1.4 Add least-privilege access.** Enable RLS; revoke all table access from `anon`; revoke INSERT/UPDATE/DELETE from `authenticated`; grant authenticated SELECT; create exactly one SELECT policy `TO authenticated USING ((select auth.uid()) = user_id)`; revoke default EXECUTE and grant authenticated EXECUTE only on the two public RPC signatures.
- [ ] **1.5 Add safe function boundaries.** Mark public RPCs `SECURITY DEFINER SET search_path = ''`, schema-qualify every object, reject null `auth.uid()`, accept no user ID parameter, and keep helpers/receipts inaccessible to browser roles. Until Phase 3 replaces their bodies, both entry points must fail closed with SQLSTATE `55000` and message `FAA 107 progress RPC is not enabled`; Phase 1 tests assert no mutation occurs. Add the table to `supabase_realtime` only with an idempotent publication-membership check.
- [ ] **1.6 Run local database gates.** Run `supabase db reset --local`, `supabase test db`, `supabase db lint --local` if exposed by `--help`, and the Supabase security/performance advisors available for the local stack. Expected: all SQL tests pass and no security finding permits cross-user or direct writes.
- [ ] **1.7 Commit the locally verified foundation.** Commit migration and SQL tests only after reading complete command output: `git commit -m "db: add FAA 107 progress security foundation"`.

### Acceptance criteria

- Public table has revision, reset generation, and non-negative reset epoch; private receipts are not Data API-visible.
- Authenticated users can SELECT only their own row and cannot directly INSERT, UPDATE, or DELETE.
- Only authenticated callers can execute the public RPCs; RPC ownership cannot be redirected.
- All function search paths are fixed and helper references schema-qualified.
- Local publication setup is repeatable; no shared database has changed.

### Tests required before moving on

`supabase db reset --local`, `supabase test db`, local advisors/lint, and `git diff --check` must pass.

### Must NOT change

No application files, auth provider behavior, shared database, remote link, production/preview environment, or service-role credentials.

### Jeremy approval

No approval is required to author and test locally. **Gate A: stop after local evidence and obtain Jeremy's explicit approval before applying this migration to the shared Supabase project.**

## Phase 2: Canonical progress model

### Objective

Build one deterministic version-1 progress model and owner-scoped cache format before any networking is introduced.

### Exact files

- Create `lib/progress-merge.ts`, `lib/progress-cache.ts`, `tests/fixtures/progress-canonical-cases.json`, `tests/progress-merge.test.cjs`, and `tests/progress-cache.test.cjs`.
- Modify `lib/types.ts` and `lib/progress-storage.ts`.

### Interfaces

```ts
export interface AuthenticatedProgressCacheEnvelope {
  envelopeVersion: 1;
  progress: ProgressState;
  resetGeneration: string | null;
  resetEpoch: string | null;
  revision: string | null;
  baseProgress: ProgressState | null;
}

export interface AnonymousImportClaim {
  ownerUserId: string;
  state: "pending" | "complete";
  snapshotHash: string;
  snapshot?: ProgressState;
}

export type NormalizeResult =
  | { status: "ok"; progress: ProgressState }
  | { status: "unsupported"; version: number; raw: unknown }
  | { status: "invalid"; reason: string; raw: unknown };

export interface ProgressDelta {
  base: ProgressState;
  proposed: ProgressState;
}

export function normalizeProgress(value: unknown, now?: Date): NormalizeResult;
export function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState;
export function deriveProgressDelta(base: ProgressState, proposed: ProgressState): ProgressDelta;
export function applyProgressDelta(current: ProgressState, delta: ProgressDelta): ProgressState;
export function canonicalProgressJson(progress: ProgressState): string;
```

### Ordered tasks

- [ ] **2.1 Write failing fixture tests.** Cover version handling, malformed fields, timestamp/UUID/route limits, 256 KiB ceiling, deterministic ties, module completion, attempts/activity retention, flashcard conflicts, and canonical byte stability.
- [ ] **2.2 Add model metadata.** Extend `ModuleProgress` with `updatedAt?: string` and `FlashcardProgress` with `reviewedAt?: Record<string, string>`; add cache/RPC/result types without changing rendered course types unnecessarily.
- [ ] **2.3 Implement canonical normalization and merge.** Validate against `lib/course-data.ts`, `lib/flashcards.ts`, and assessment data; union before caps; sort quiz/exam/activity newest-first with ID tie-breakers; recompute module completion from current slides; make flashcard state timestamp-driven.
- [ ] **2.4 Implement owner-scoped cache storage.** Keep anonymous `faa107-progress-v1`; use `faa107-progress-v1:<user_id>`, `faa107-progress-unsynced-v1:<user_id>`, and `faa107-progress-anonymous-import-v1`; encode bigint metadata as decimal strings.
- [ ] **2.5 Implement durable anonymous claim semantics.** Acquire Web Lock, store exact normalized pending snapshot and hash, retry from stored snapshot, and clear anonymous state only when its current hash still matches after canonical confirmation.
- [ ] **2.6 Preserve the write funnel.** Keep existing exported progress APIs synchronous and browser-event-compatible; make local writes update only envelope `progress`, preserving generation/epoch/revision/base metadata; retain active-exam key behavior unchanged.
- [ ] **2.7 Run model gates.** Run `node --test tests/progress-merge.test.cjs tests/progress-cache.test.cjs tests/phase2a-core-flow.test.cjs tests/module-progress-cards.test.cjs` and `npx tsc --noEmit`.
- [ ] **2.8 Commit the canonical model.** Stage only Phase 2 files and commit `feat: add canonical progress model` after all gates pass.

### Acceptance criteria

- Anonymous use remains network-free and backward compatible.
- Authenticated keys never read another user's bytes; untagged scoped data is never silently promoted.
- Client fixtures exactly implement module, quiz, exam, flashcard, and activity rules and 30/10/8 retention.
- Unsupported future versions are preserved and blocked, not normalized to empty.

### Tests required before moving on

All Phase 2 tests, typecheck, and `git diff --check` pass; fixture output is deterministic across repeated runs.

### Must NOT change

No Supabase calls, React auth lifecycle, UI copy/layout, active-exam persistence, course content, or assessment scoring.

### Jeremy approval

No approval for local model work. Any proposed deviation from the approved normalization or retention rules requires Jeremy approval before editing.

## Phase 3: Atomic RPC implementation

### Objective

Complete and locally prove the only authorized remote write paths, including concurrency, idempotency, and reset-history decisions.

### Exact files and interfaces

- Modify `supabase/migrations/20260712000000_account_progress_sync.sql` and `supabase/tests/account_progress_sync.sql`.
- Create `tests/progress-rpc-contract.test.cjs` and `tests/progress-rpc-integration.test.cjs`.
- Consume `tests/fixtures/progress-canonical-cases.json`.

```sql
public.commit_faa107_progress(
  expected_revision bigint,
  expected_generation uuid,
  base_progress jsonb,
  proposed_progress jsonb,
  operation_id uuid
)

public.reset_faa107_progress(operation_id uuid)
```

Both return `status, progress, revision, reset_generation, reset_epoch`.

### Ordered tasks

- [ ] **3.1 Write failing RPC tests.** Cover unauthenticated calls, owner derivation, no row, simultaneous first rows, `first_row_race`, `pre_generation_rejected`, `generation_mismatch`, matching commit, revision conflict, duplicate operation ID, invalid/oversized data, and receipt pruning.
- [ ] **3.2 Implement consistent lock order.** Both RPCs acquire `pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended((select auth.uid())::text, 0))`, then `SELECT ... FOR UPDATE`; keep transactions free of external work.
- [ ] **3.3 Implement first-row and reset-epoch decisions.** First normal creation uses epoch 0. Null generation against epoch 0 returns `first_row_race`; against epoch above 0 returns terminal `pre_generation_rejected`. Non-null old generation returns `generation_mismatch`.
- [ ] **3.4 Implement canonical conflict merge.** Matching revision commits proposed state; revision mismatch derives base-to-proposed delta, merges into locked canonical state, applies retention, increments revision, and returns `revision_conflict` with the persisted merged row.
- [ ] **3.5 Implement idempotency.** Insert receipt in the same mutation transaction; duplicate IDs return `duplicate` without mutation; `first_row_race` and `pre_generation_rejected` insert no receipt; prune receipts older than 30 days in bounded batches.
- [ ] **3.6 Implement reset.** Reset never deletes; it writes empty canonical progress, changes generation, increments revision and epoch exactly once, creates absent row at epoch 0 then advances to 1, and is idempotent by operation ID.
- [ ] **3.7 Prove fixture parity locally.** For every shared JSON fixture, compare TypeScript canonical output with local RPC output byte-for-byte.
- [ ] **3.8 Run RPC gates.** Run local reset, SQL tests, Node contract/integration tests, advisors, typecheck, and `git diff --check`.
- [ ] **3.9 Commit the atomic RPC implementation.** Stage the completed migration and RPC tests and commit `feat: add atomic progress sync RPCs`. The fail-closed Phase 1 bodies must no longer exist.

### Acceptance criteria

- Two first commits converge without uniqueness failure; delayed pre-reset null candidates cannot cross epoch above 0.
- Two revision-N disjoint writes persist both updates even if the conflict recipient closes before retry.
- Reset defeats in-flight, stale-device, offline-restart, and delayed null-generation resurrection.
- Browser roles cannot bypass RPC ownership or call private helpers.

### Tests required before moving on

`supabase test db`, `node --test tests/progress-rpc-contract.test.cjs tests/progress-rpc-integration.test.cjs`, local advisors, typecheck, and diff check all pass.

### Must NOT change

No client coordinator/UI, no direct client table writes, no DELETE reset, no service-role key, and no shared migration without Gate A approval.

### Jeremy approval

Gate A remains mandatory. After approval, apply the reviewed migration once to the named shared project, record the exact migration/version, immediately run owner/anon/cross-user security probes and advisors, and stop on any discrepancy. Approval to migrate does not authorize push or deploy.

## Phase 4: Client sync coordinator

### Objective

Connect authenticated local state to the proven RPC boundary through one serialized, account-safe lifecycle coordinator.

### Exact files

- Create `lib/progress-rpc.ts`, `lib/progress-sync.ts`, and `tests/progress-sync.test.cjs`.
- Modify `lib/progress-storage.ts`, `components/auth-provider.tsx`, and `tests/supabase-auth.test.cjs`.

### Interfaces

```ts
export type ProgressSyncStatus = "idle" | "saving" | "synced" | "local-only" | "update-required";
export interface ProgressSyncSnapshot { status: ProgressSyncStatus; userId: string | null; message: string | null; }
export interface ProgressSyncCoordinator {
  authChanged(user: User | null): Promise<void>;
  localWrite(): void;
  reset(): Promise<void>;
  flush(reason: "debounce" | "online" | "visibility" | "pagehide"): Promise<void>;
  subscribe(listener: (snapshot: ProgressSyncSnapshot) => void): () => void;
  dispose(): void;
}
```

### Ordered tasks

- [ ] **4.1 Write coordinator tests first.** Use injected storage, clock, timers, network, and RPC fakes for startup/write, debounce, reset, retry, sign-out, token refresh, rapid A-to-B switch, pending old response, Realtime update, and disposal.
- [ ] **4.2 Implement the typed RPC adapter.** SELECT only the active user's row, call the two RPCs, map bigint to strings, subscribe to owner-filtered Postgres Changes, refresh Realtime auth on token change, and remove channels on epoch/user change.
- [ ] **4.3 Implement one serialized queue.** Route startup, writes, reset, retry, auth, online, focus, visibility, pagehide, and Realtime through it; every continuation validates `{ activeUserId, sessionEpoch }` before side effects.
- [ ] **4.4 Implement startup generation gate.** Remote unavailable retains tagged local metadata. Generation/epoch mismatch discards local bytes. Null metadata with existing remote is unverified and discarded. Missing row uses the first-commit path.
- [ ] **4.5 Implement write durability.** Persist marker before debounce; use envelope revision/generation/base; handle `first_row_race`, terminal `pre_generation_rejected`, `generation_mismatch`, revision conflict, and duplicate exactly as specified.
- [ ] **4.6 Implement retry/lifecycle behavior.** Backoff 1/2/4/8/16/32/60 seconds with 20% jitter, one timer, immediate online retry, persisted restart recovery, and best-effort keepalive flush without correctness dependence.
- [ ] **4.7 Wire auth lifecycle.** `AuthProvider` owns one coordinator, increments session epoch on auth changes, and keeps anonymous/course routes usable when auth or sync fails.
- [ ] **4.8 Run coordinator gates.** Run progress sync/cache/merge/auth tests, typecheck, and diff check.
- [ ] **4.9 Commit the coordinator.** Stage only Phase 4 files and commit `feat: sync account progress` after targeted gates pass.

### Acceptance criteria

- Startup, writes, reset, and auth changes never interleave across owner contexts.
- A-to-B switch causes zero A-cache reads/uploads under B; A return restores only A envelope plus A row.
- Realtime reset and later fetch/rejected write all converge on the new empty generation.
- Offline progress remains usable and visibly pending until canonical confirmation.

### Tests required before moving on

`node --test tests/progress-sync.test.cjs tests/progress-cache.test.cjs tests/progress-merge.test.cjs tests/supabase-auth.test.cjs`, typecheck, and diff check pass.

### Must NOT change

No route gating, payment/Auth provider additions, course UI refactor, direct Supabase writes, or broad auth-provider redesign beyond coordinator ownership.

### Jeremy approval

No approval for mocked/local implementation. **Gate B: obtain Jeremy approval before using shared-project accounts/rows for browser proof.**

## Phase 5: UI and reset behavior

### Objective

Expose truthful, non-blocking sync state and destructive reset behavior with minimal UI change.

### Exact files

- Modify `components/auth-provider.tsx`, `components/modern-flight-school-shell.tsx`, `components/dashboard-summary.tsx`, `components/modern-flight-school.module.css`, and `tests/supabase-auth.test.cjs`.

### Ordered tasks

- [ ] **5.1 Write UI assertions first.** Assert AuthContext status/reset exposure, authenticated status copy, polite live region, exact reset confirmation, anonymous browser-only reset, and logged-out sync copy without “when available.”
- [ ] **5.2 Expose status/reset.** Extend AuthContext with `progressSync` and `resetProgress`; keep auth loading/errors separate from sync status.
- [ ] **5.3 Render account-control status.** Show “Saving progress…”, “Progress synced”, “Saved locally — sync pending”, or “Update required to sync progress” only for authenticated users, with polite live-region behavior.
- [ ] **5.4 Coordinate reset.** Signed-in reset uses the exact cross-device confirmation and coordinator RPC; anonymous reset confirms browser-only removal and stays local.
- [ ] **5.5 Correct dashboard copy.** State that login syncs progress across devices and local progress works without an account.
- [ ] **5.6 Run UI gates.** Run auth, accessibility, redesign, and module-progress tests plus typecheck/build.
- [ ] **5.7 Commit the UI behavior.** Stage only Phase 5 files and commit `feat: show progress sync status` after UI gates pass.

### Acceptance criteria

- Status never blocks lessons or routes and never claims sync before canonical confirmation.
- Reset failure retains pre-reset state; success renders the returned empty envelope.
- Confirmation explicitly says account-wide, across-device deletion.
- Logged-out learner can continue unchanged.

### Tests required before moving on

`node --test tests/supabase-auth.test.cjs tests/accessibility.test.cjs tests/complete-redesign.test.cjs tests/modern-flight-school-production.test.cjs`, typecheck, build, and diff check pass.

### Must NOT change

No navigation redesign, new modal library, course copy, payment/Apple features, or login requirement.

### Jeremy approval

No approval for the approved copy and minimal styling. Any visual redesign or different destructive wording requires approval.

## Phase 6: Verification and closeout

### Objective

Prove the complete story across pure logic, local PostgreSQL, shared security boundaries, browsers, and standard repository gates while keeping local/pushed/deployed truth distinct.

### Exact files

- Create `tests/account-progress-sync-browser.test.cjs`.
- Modify `docs/supabase-auth-configuration.md`, `README.md`, and `SESSION.md` only with observed results.

### Ordered tasks

- [ ] **6.1 Run the full automated suite.** `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`; record counts and failures exactly.
- [ ] **6.2 Re-run database/security proof.** Local SQL/RPC tests plus shared anonymous denial, A/B isolation, direct-write denial, private-helper denial, and advisor results after Gate A migration approval.
- [ ] **6.3 Run canonical parity.** Execute every shared fixture through TypeScript and the migrated RPC and compare canonical JSON byte-for-byte.
- [ ] **6.4 Run two-device concurrency proof.** Two browser contexts start at revision N, make disjoint updates, commit in both orders, and verify one row contains both; separately close the conflict recipient before retry and verify both remain.
- [ ] **6.5 Run A→B→A proof.** Same browser: anonymous import once, A sign-out, B sign-in with zero A import, A sign-in restoring only A; include an old-A response completing after B switch.
- [ ] **6.6 Run reset proof matrix.** Cover in-flight old-generation write, stale second device, G1 clean offline restart after G2 reset, first-commit→reset→delayed-null, reset-before-first-commit, Realtime open device, reload, and reset failure.
- [ ] **6.7 Run restoration/local-only proof.** Same user in clean context restores module/quiz data; logged-out clean context persists locally and makes no Supabase progress request.
- [ ] **6.8 Update closeout docs.** Record migration name/state, exact grants/RLS, command evidence, browser evidence, caveats, and explicit local/committed/shared/pushed/deployed truth.
- [ ] **6.9 Commit verified implementation locally.** Include only reviewed files; do not push, merge, or deploy.

### Acceptance criteria

- Every approved design acceptance test has automated or browser evidence.
- No service-role/secret key is present; cross-user and anonymous remote access fail.
- Concurrency preserves disjoint data; reset cannot resurrect through any stale or null-generation path.
- Full repository gates pass and documentation reports only observed truth.

### Tests required before completion

All Phase 1–5 targeted tests, complete `npm test`, lint, typecheck, production build, local/shared security probes, browser matrix, and `git diff --check` pass with zero unexplained failures.

### Must NOT change

No payments, Apple Sign In, course content, assessment semantics, deployment configuration, domain settings, push, merge, or deployment.

### Jeremy approval

Gate B is required before shared-account/browser proof. Separate explicit approvals are required for any push, merge, or deploy after closeout.

## Concise execution order

1. Author migration and SQL security tests; prove them on local Supabase.
2. Build and prove the pure canonical model, scoped cache, and fixtures.
3. Complete RPCs and client/server fixture parity on local Supabase.
4. Present local database/RPC evidence and stop at Gate A.
5. After Gate A approval, apply once to shared Supabase and run immediate security/advisor probes.
6. Build the coordinator, then the minimal status/reset UI.
7. Present automated evidence and stop at Gate B.
8. After Gate B approval, run shared-account/browser verification and closeout gates.
9. Commit locally; stop before push, merge, or deploy.

## Explicit approval gates

- **Gate A — Shared migration:** Jeremy must explicitly approve applying the reviewed migration to the shared Supabase project. Local authoring/testing does not satisfy this gate.
- **Gate B — Shared browser proof:** Jeremy must explicitly approve use of shared-project test accounts and rows for concurrency, account-switch, restoration, and reset browser proof.
- **Gate C — Scope changes:** Any deviation from the approved merge, retention, reset, security, or copy rules stops for Jeremy approval.
- **Gate D — Git/deployment:** Push, merge, and deploy each remain separately unauthorized until Jeremy explicitly approves them.

## Definition of done

- All six phases meet their acceptance criteria and gates.
- Migration/RPC objects, grants, RLS, advisory locking, receipts, revision/generation/epoch behavior, and Realtime publication are verified.
- Canonical client/server fixtures match; all account, concurrency, reset, offline, retry, and anonymous scenarios pass.
- Standard test/lint/typecheck/build/diff gates pass.
- Only public browser credentials are used.
- README, SESSION, and Supabase configuration docs accurately distinguish local, committed, shared-database, pushed, and deployed state.
- Implementation is locally committed and remains unpushed, unmerged, and undeployed until separately approved.

## Material risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Client and SQL canonical algorithms drift | Conflicts become order-dependent or lose data | One shared fixture corpus, byte-for-byte local RPC parity gate, and no shared migration approval until parity passes |
| Security-definer privilege mistake | Cross-user data access or unauthorized writes | Fixed empty search paths, schema qualification, `auth.uid()` ownership, revoked default EXECUTE, direct-write revokes, adversarial anon/A/B SQL tests, advisors |
| Null/stale client resurrects reset progress | Destructive reset becomes untrustworthy | Durable `reset_epoch`, terminal `pre_generation_rejected`, generation mismatch discard, startup envelope gate, explicit lock-order tests |
| First-row/concurrent write race | Uniqueness error or lost disjoint update | Per-user advisory transaction lock, row lock, operation IDs, server conflict merge, simultaneous-first and revision-N tests |
| Auth transition leaks state across accounts | A progress enters B cache/row | User-scoped keys, serialized queue, `{activeUserId, sessionEpoch}` continuation checks, abort/dispose, A→B→A and pending-response proof |
| Offline/page lifecycle loses unsynced work | Progress remains local or appears synced falsely | Persist marker before network, durable base envelope, bounded backoff/online retry, best-effort flush only, restart recovery tests |
| Realtime is delayed or unavailable | Open device temporarily shows stale pre-reset state | Treat Realtime as acceleration only; refetch on online/focus/visibility/token refresh and reject stale writes by generation/epoch |
| Shared-project migration affects another product | Cross-project outage or schema collision | Unique FAA-prefixed objects, local reset/tests first, explicit Gate A, migration diff review, immediate security/advisor probes, no unrelated object changes |
