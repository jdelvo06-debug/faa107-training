# FAA 107 Account Progress Sync Design

**Date:** 2026-07-12
**Status:** Approved for implementation
**Branch:** `codex/faa107-training-platform`

## Goal

Persist a signed-in learner's FAA 107 course progress in Supabase so lesson completion, quiz attempts, flashcard state, exam attempts, and recent activity follow the learner across devices. Anonymous learners continue using the existing localStorage workflow without an account or network dependency.

## Scope and constraints

- Keep authentication additive. No lesson, quiz, flashcard, exam, dashboard, or study-plan route requires login.
- Keep localStorage as the immediate source for rendering and as the offline fallback for every learner.
- Store FAA 107 progress in a new `public.faa107_user_progress` table in the existing shared Supabase project.
- Use the browser's authenticated Supabase session and public client key only. Do not add or use a service-role key.
- Do not change course content, payments, Apple Sign In, assessment behavior, or module UX.
- Do not push, merge, or deploy the Git branch. A live database migration is allowed only for the approved shared project so the requested cross-device proof can be performed.
- Preserve the existing untracked `docs/builder-prompts/auth-supabase-plan.md` file unchanged.

## Architecture

### Local-first storage boundary

`lib/progress-storage.ts` remains the only write funnel for learner progress. Existing functions continue to synchronously update localStorage and dispatch the existing browser progress event so the UI never waits for Supabase.

The storage module will also publish progress-write notifications to an in-memory subscriber. With no authenticated sync subscriber, writes stop at localStorage exactly as they do today. This makes anonymous behavior independent of Supabase and avoids modifying each lesson, quiz, flashcard, and exam component.

### Pure merge module

A new `lib/progress-merge.ts` module will own normalization and deterministic merging. It will be independent of React and Supabase so merge behavior can be exhaustively unit tested.

The merge result will always be a valid `ProgressState`. It will never replace a richer local collection with a thinner remote collection.

### Authenticated sync coordinator

A new `lib/progress-sync.ts` module will expose a testable coordinator with injected local-storage and Supabase-client dependencies. `AuthProvider` will start one coordinator when a user becomes available and stop it when that user signs out or changes.

Startup flow:

1. Read the current local progress immediately.
2. Select the authenticated user's remote row by `user_id`.
3. Treat a missing row as empty progress.
4. Merge local and remote progress.
5. Persist the merged state locally without recursively scheduling another write.
6. Upsert the merged state for the authenticated user.

Future-write flow:

1. A local progress write updates the UI immediately.
2. The coordinator marks sync as saving and resets a short debounce timer.
3. When the timer expires, it re-reads the remote row, merges it with the latest local state, writes any newly merged information locally, and upserts the merged state remotely.
4. A successful upsert marks the state synced. A read or write failure leaves local progress intact and reports a local-only state without throwing into the course UI.

Re-reading before each upsert prevents a stale browser from knowingly replacing newer remote collections. Stable item IDs and per-item timestamps make subsequent merges convergent if two devices write close together.

### Reset and sign-out behavior

Signing out only stops the coordinator. It does not clear localStorage or delete the remote row.

The existing explicit Reset progress action remains a deliberate destructive action. Anonymous reset clears local progress only. While signed in, reset clears local progress immediately and instructs the coordinator to delete the authenticated remote row rather than merging the old remote state back into the cleared local state. The delete policy exists for this user-owned reset path.

## Progress merge rules

### Normalization

Malformed or missing top-level collections normalize to the existing empty version-1 shape. Invalid individual records are ignored rather than allowed to break startup sync. Existing version-1 localStorage remains readable.

### Modules

- Union `visitedSlideIds` from both states and remove duplicates.
- Validate visited IDs against the actual slide IDs in `lib/course-data.ts`.
- Recompute `completed` from the validated union: a module is complete only when every current slide ID for that module has been visited.
- Add an optional `updatedAt` timestamp to `ModuleProgress`; `markSlideVisited` updates it.
- Choose `lastSlideId` from the newer module timestamp when that ID is valid and visited. For legacy records without timestamps, prefer a valid local value, then a valid remote value, then the latest valid visited ID.

This prevents an obsolete completion boolean or invalid slide ID from fabricating completion while preserving a completed lesson from either device.

### Quiz and exam attempts

- Union records by their stable `id`.
- If the same ID appears twice, keep the record with the later `completedAt` timestamp.
- Sort newest first.
- Do not truncate during merge, so records contributed by either device survive the merge.

New attempts retain the existing random UUID and completion timestamp behavior.

### Recent activity

- Union records by stable `id`.
- Resolve duplicate IDs by the later `at` timestamp.
- Sort newest first.
- Do not truncate during merge.

### Flashcards

`FlashcardProgress` will gain an optional per-card review timestamp map. Existing `known` and `unknown` arrays remain the rendered state and remain backward compatible.

- Preserve every card appearing on either device.
- Keep `known` and `unknown` disjoint.
- When both devices agree on a card, retain that state and the newest available review timestamp.
- When devices disagree and both have timestamps, use the more recently reviewed state.
- When only one side has a timestamp, use that timestamped state.
- For legacy conflicts with no timestamps, prefer local state so a first sign-in cannot silently replace the learner's current browser choice.
- `saveFlashcardProgress` stamps cards whose known/unknown state changed, enabling deterministic future merges without changing the flashcard UI.

## Database design

The migration will create:

```sql
create table public.faa107_user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null,
  updated_at timestamptz not null default now()
);
```

The same migration will:

- Explicitly revoke table access from `anon`.
- Explicitly grant `select`, `insert`, `update`, and `delete` to `authenticated`, as required for new Data API tables.
- Enable row-level security.
- Create separate SELECT, INSERT, UPDATE, and DELETE policies scoped to `TO authenticated` and `(select auth.uid()) = user_id`.
- Give UPDATE both `USING` and `WITH CHECK` ownership predicates.
- Add a narrowly named trigger function and `before update` trigger that always sets `updated_at = now()`.
- Keep the trigger function security-invoker and revoke direct execution from `public`.

No policy grants cross-user access. No client code receives elevated credentials.

## Sync status UX

`AuthContext` will expose a compact progress-sync status for authenticated UI only:

- `Saving progress…` while startup or a debounced write is active.
- `Progress synced` after a confirmed remote upsert.
- `Saved locally` after an offline/read/write failure.

The status will appear beside existing account controls with polite live-region behavior. It will not create alerts, modals, toasts, or route-blocking states.

The logged-out dashboard prompt will change to truthfully state that logging in syncs progress across devices, while also stating that local progress works without an account.

## Testing strategy

All behavioral implementation will follow red-green-refactor cycles.

### Merge unit tests

- Local-only first sign-in imports progress to an empty remote state.
- Remote-only progress restores into an empty new-device local state.
- Two-device merging preserves completed lessons and all quiz attempts.
- A stale, thinner remote state cannot overwrite richer local progress.
- Module completion is recomputed from actual current slide IDs.
- Invalid `lastSlideId` values are not restored.
- Flashcard conflicts use per-card timestamps and preserve non-conflicting progress.

### Mock sync tests

- Authenticated startup selects and merges the user's row.
- A local write produces one debounced upsert rather than one request per write.
- A flush re-reads and merges remote progress before upserting.
- Select and upsert failures leave local progress usable and set local-only status.
- Anonymous writes never call Supabase.
- Sign-out stops remote synchronization without erasing localStorage.
- Authenticated reset deletes only the current user's remote row and does not resurrect it.

### Migration review

Tests will inspect the migration for the exact table, foreign key, explicit authenticated grant, anonymous revoke, RLS enablement, four owner-only policies, UPDATE `WITH CHECK`, and timestamp trigger. Live verification will confirm that anonymous access is denied and two authenticated users cannot read or change each other's rows.

### Browser proof

Using the local application against the approved shared Supabase project:

1. Sign in and complete Module 1 plus a module quiz.
2. Confirm the authenticated user's remote row contains the completion and quiz attempt.
3. Open a clean browser context, sign in as the same user, and confirm Module 1 and its quiz result restore.
4. Use a logged-out clean context to confirm lesson progress still persists locally without a remote request.

Browser proof will not be represented as production deployment proof because the Git branch will remain local and unpushed.

## Verification and closeout

Before the final local commit, run and inspect:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

The closeout report will identify the migration name, changed files, exact RLS policy behavior, command results, browser evidence, remote-migration state, and any remaining caveats. It will distinguish local committed truth, shared-database truth, and undeployed production truth.
