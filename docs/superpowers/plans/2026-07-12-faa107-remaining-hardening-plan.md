# FAA 107 Remaining Hardening Implementation Plan

> **For Hermes:** Use subagent-driven development or a single approved builder lane to execute one phase at a time. Re-read current package versions and production configuration before implementation; this plan records priorities, not frozen dependency numbers.

**Goal:** Harden the deployed FAA 107 platform without reopening completed remediation or conflating observations, required work, and optional product expansion.

**Architecture:** Preserve the current Next.js local-first learning model and Supabase owner-scoped account sync. Execute security first, then content/performance, then device/offline quality. Payment work remains planning-only unless separately approved.

**Tech stack:** Next.js App Router, React, TypeScript, Tailwind/Radix, Supabase Auth/PostgreSQL/Realtime, Vercel, Node tests, SQL tests, and Playwright/browser QA.

---

## Status Boundaries

### Completed and deployed — do not duplicate

- Production/default branch `codex/faa107-training-platform` is deployed at `faa107training.org` through application commit `411a2b7`.
- `5354045` shipped the production design, install manifest/icons, SEO metadata, sitemap/robots behavior, and iOS safe-area styling.
- `b8b100d` and `9bc762e` shipped and hardened email/password and Google authentication. Apple is deferred.
- Account progress sync shipped through `411a2b7`; migration `20260712000000_account_progress_sync.sql` is applied to `qbeioesktbpvdlgzrgsm`.
- Anonymous progress is local-only. Signed-in progress is user-scoped, restorable in clean contexts, isolated across accounts, and resettable account-wide.
- Real-browser proof passed for core sync, restore, isolation, and reset.

### User observation / soak — not a release blocker or a passed test

The initial live Realtime open-tab reset propagation check failed. The `411a2b7` repair passed automated review, but the final live event retest was inconclusive because the listener had no pre-reset record. A future soak should begin with known synced progress visible in the listening tab, reset from a second context, and record event/refetch/UI timing. Realtime remains an accelerator; correctness must continue to rely on RPC generation/revision rules and refetch/reload recovery.

### Next recommended work

Execute Phases 1–5 in order. Phase 6 is optional and requires a separate product decision.

---

## Phase 1 — Next.js and Dependency Security Upgrade

**Objective:** Move off the currently pinned Next.js 14.2.35/security-advisory baseline and establish a supported, reproducible dependency set without changing product behavior.

**Likely paths:**

- `package.json`
- `package-lock.json`
- `next.config.*` if upgrade compatibility requires it
- `.eslintrc.json` and lint scripts if required by the selected Next.js release
- `app/`, `middleware.ts`, and `lib/supabase/` only for documented compatibility repairs
- `tests/*.test.cjs`

**Tasks:**

1. Capture current `npm audit`, test, lint, type-check, and build baselines.
2. Select a supported Next.js/React/eslint-config-next combination from official release and security guidance; prefer the smallest safe upgrade before considering a framework-major migration.
3. Update lockfile deterministically and repair only verified compatibility breaks.
4. Run auth callback, middleware/session refresh, account sync/reset, static route, metadata, and manifest regressions.
5. Re-run production-dependency audit and document any accepted residual advisory with reachability/rationale.

**Verification / done standard:** `npm test`, lint, `npx tsc --noEmit`, and `npm run build` pass; production audit has no unreviewed high-severity issue; auth/sync browser smoke passes; generated route count and metadata/PWA endpoints remain intact; dependency diff contains no unrelated package churn.

**Approval gate:** Jeremy approves the target dependency versions and residual audit posture before merge/deploy. A framework-major jump requires its own explicit approval if the smallest safe upgrade is not sufficient.

**Scope exclusions:** No UI redesign, content rewrite, Supabase schema change, Apple auth, payment work, or replacement of the progress architecture.

---

## Phase 2 — Production Security Headers

**Objective:** Add a measured browser security-header policy that protects the production application without breaking Supabase auth, OAuth callbacks, images, or Vercel delivery.

**Likely paths:**

- `next.config.*` or `middleware.ts`
- `app/layout.tsx` only if nonce/metadata integration is actually required
- `tests/` for header/config regressions
- deployment configuration documentation

**Tasks:**

1. Inventory current production response headers and all required origins for Supabase, images, fonts, and OAuth navigation.
2. Add `Content-Security-Policy` in report-only mode first if a strict enforceable policy cannot be proven locally.
3. Add/refine `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, and framing protection (`frame-ancestors` preferred); assess HSTS only on the canonical HTTPS domain and hosting topology.
4. Verify login/signup, Google redirect initiation/callback, signed-in sync/reset, PWA metadata/icons, and all chart images under the proposed policy.
5. Promote CSP from report-only to enforcing only when violations are understood and required flows pass.

**Verification / done standard:** Automated header assertions pass; live response inspection after approved deployment shows intended headers; no browser console CSP violations on core routes; email/password, Google auth, sync/reset, images, and PWA endpoints work.

**Approval gate:** Jeremy approves the policy and any required third-party origin before enforcement/deployment. Do not silently weaken directives to remove console noise.

**Scope exclusions:** No WAF/bot-management project, no secret rotation unless exposure is discovered, no auth-provider expansion, and no database permission redesign absent a finding.

---

## Phase 3 — Content Governance and Source Freshness

**Objective:** Make regulatory accuracy maintainable by recording authoritative sources, review dates, ownership, and a repeatable freshness process.

**Likely paths:**

- `lib/course-data.ts`
- `lib/questions.ts`
- `lib/flashcards.ts`
- `lib/acs-weights.ts`
- `app/cram-sheet/`
- `app/resources/`
- a new `docs/content-governance.md` and/or machine-readable source registry under `lib/` or `data/`
- `tests/content-regressions.test.cjs` and related content tests

**Tasks:**

1. Define a minimal source record: topic/fact owner, FAA/eCFR URL, source edition/effective date where available, last-reviewed date, and next-review trigger.
2. Inventory high-risk facts first: operating limitations, registration, recurrent training/certification, operations over people, airspace, weather minimums, and ACS weighting.
3. Link duplicated learner-facing facts to one governed source or add regression checks that prevent drift.
4. Establish a scheduled/manual freshness checklist for eCFR, ACS, FAA study guidance, and external resources; record review evidence without claiming FAA endorsement.
5. Review learner-facing "current" language and stale/dead outbound links.

**Verification / done standard:** Every high-risk fact has an authoritative source and review date; duplicate critical facts are centralized or regression-protected; link/source checks pass; a second reviewer signs off regulatory edits; docs distinguish educational guidance from legal advice/endorsement.

**Approval gate:** Jeremy approves the governance format before bulk annotation and approves any learner-facing regulatory correction after source review.

**Scope exclusions:** No wholesale curriculum rewrite, new module, legal opinion, generated unsourced content, or changes justified only by the historical audit without current-source verification.

---

## Phase 4 — Performance and Curriculum Bundle Split

**Objective:** Stop loading full slide bodies in shared navigation/application bundles and reduce route cost without changing curriculum behavior.

**Likely paths:**

- `lib/course-data.ts`
- new lightweight module metadata and route-scoped content modules under `lib/` or `data/`
- `components/module-nav.tsx`
- `components/app-shell.tsx`
- `app/modules/[id]/`
- `components/slide-viewer.tsx`
- optional chart assets under `public/images/charts/`
- performance and route regression tests

**Tasks:**

1. Record route-level build sizes and browser transfer/parse baselines for `/`, `/about`, `/dashboard`, `/exam`, and representative module routes.
2. Extract only navigation/list metadata (ID, title, counts/status mapping) from full slide bodies.
3. Load full curriculum content only in module/quiz paths that need it; preserve static generation and direct route access.
4. Re-measure bundles before considering Framer Motion removal or image conversion.
5. Optimize oversized charts only when labels remain legible at mobile zoom and source fidelity is preserved.

**Verification / done standard:** Shared routes no longer import full course content; build/test/type/lint pass; module/quiz/flashcard routes retain identical content and progress keys; measured shared-route JavaScript materially decreases and the before/after table is documented; no accessibility or static-generation regression.

**Approval gate:** Jeremy approves the data-module boundary and measured result before merge. Further animation/image work needs evidence that it materially improves the remaining bottleneck.

**Scope exclusions:** No content edits, route renumbering, progress-key migration, visual redesign, speculative state library, or database-backed curriculum CMS.

---

## Phase 5 — Offline PWA and Physical iPhone/VoiceOver Quality

**Objective:** Add deliberate, versioned offline behavior and verify the already-shipped install/SEO/safe-area foundations on real Apple hardware and assistive technology.

**Likely paths:**

- service-worker/offline implementation under `public/`, `app/`, or a selected maintained Next-compatible integration
- `app/manifest.ts` only for corrections found in real-device QA
- `app/layout.tsx` and global styles only for verified standalone/safe-area defects
- local progress schema/version handling in `lib/progress-storage.ts` and `lib/progress-cache.ts`
- PWA/browser tests plus a device QA checklist under `docs/`

**Tasks:**

1. Define offline contract: cached shell/curriculum routes, network-first auth/sync behavior, excluded sensitive/dynamic responses, update invalidation, and user-facing stale/offline messaging.
2. Implement minimal versioned caching without caching OAuth callbacks, auth responses, or user-specific Supabase data.
3. Verify first online load → offline relaunch, direct cached module navigation, update activation, corrupted/stale cache recovery, and anonymous/signed-in local progress durability.
4. On a physical iPhone, test Safari and Add to Home Screen: install icon/name, launch, safe areas, rotation, keyboard/forms, charts, offline/reconnect, auth handoff, and update behavior.
5. Run VoiceOver through primary navigation, module slides, quiz answers/feedback, exam review, login/signup, sync status, and reset confirmation.
6. Perform the deferred Realtime soak separately with a listening tab/device that first holds known synced pre-reset progress; report timing and outcome as observation evidence.

**Verification / done standard:** Offline contract is documented and automated where practical; no auth/user-specific network response is cached; offline/reconnect and update recovery pass; physical-device matrix records device/iOS/browser/mode/results; blocking VoiceOver issues are fixed or explicitly deferred with severity; Realtime soak result is accurately labeled and is not used as the correctness gate.

**Approval gate:** Jeremy approves the caching strategy before service-worker adoption and reviews the physical-device/VoiceOver evidence before declaring PWA hardening complete. Native wrapper/App Store work is a separate decision.

**Scope exclusions:** Do not redo shipped manifest/icons/SEO/sitemap/robots/safe-area work without a reproduced defect; no React Native rewrite, Capacitor wrapper, background sync guarantee, or offline authentication promise.

---

## Phase 6 — Optional Payment Planning (Planning Only)

**Objective:** Decide whether monetization is desirable and, only if approved, produce a security/privacy-aware payment design before writing payment code.

**Likely paths:**

- a new product/payment design under `docs/superpowers/specs/`
- pricing/entitlement requirements documentation
- future server/API/webhook paths only after provider and hosting decisions
- Supabase schema/RLS design only after entitlement requirements are approved

**Tasks:**

1. Decide business model, learner/instructor audience, free boundary, refund/support policy, and whether accounts must own entitlements.
2. Compare hosted-checkout providers and identify tax, privacy, terms, webhook, and customer-support obligations.
3. Design server-verified entitlements, idempotent webhook processing, failure/retry states, and test-mode release gates.
4. Produce threat model, data-flow diagram, cost estimate, and implementation plan before any provider account/schema/UI change.

**Verification / done standard:** A written go/no-go decision exists; an approved design defines product behavior, provider, data ownership, webhook verification, entitlement enforcement, privacy/support obligations, test plan, and rollback. “Done” for this phase does not mean payments are live.

**Approval gate:** Explicit Jeremy product and cost approval is required before creating paid-provider resources, database migrations, checkout UI, or webhook endpoints.

**Scope exclusions:** No payment implementation, provider signup, pricing publication, secrets, schema migration, entitlement gate, or production configuration during planning.

---

## Cross-Phase Release Discipline

For every implementation phase:

1. Start from the current remote production branch and inspect the dirty worktree.
2. Keep unrelated/untracked files out of commits.
3. Run the phase-specific checks plus `npm test`, lint, type-check, build, and `git diff --check`.
4. Record local committed, pushed, deployed, database, and live-browser truth separately.
5. Require explicit approval before push/deploy/database/provider changes.
6. Update `README.md` and `SESSION.md` only after the verified state changes.

## Recommended Next Move

Begin with **Phase 1: Next.js and Dependency Security Upgrade**. Do not combine it with security headers in the same implementation commit unless the dependency upgrade is independently green and reviewable.
