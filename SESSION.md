# FAA 107 — Session Tracking

## Current Status

- **Last reconciled:** 2026-07-12
- **Production:** [faa107training.org](https://faa107training.org)
- **Production/default branch:** `codex/faa107-training-platform`
- **Deployed application commit:** `411a2b7`
- **Hosting:** Vercel
- **Backend:** Supabase project `qbeioesktbpvdlgzrgsm`
- **Auth:** email/password and Google OAuth are deployed; Apple Sign In is deferred
- **Progress:** anonymous learning is local-only; signed-in progress is local-first and synchronized to one user-scoped Supabase row with account-wide reset support
- **Database:** shared migration `20260712000000_account_progress_sync.sql` is applied

The application is no longer client-only/no-backend. Supabase handles authentication and signed-in progress persistence, while anonymous learners keep the original local-only behavior.

## Verification Truth

- Core real-browser proof passed for signed-in synchronization, clean-context restoration, A/B account isolation, and account-wide reset.
- The first live open-tab Realtime propagation observation failed. The repair in `411a2b7` passed automated review and regression coverage.
- The final live event retest was **inconclusive**, not a pass: the listening tab had no pre-reset record to invalidate. Keep this as a deferred soak observation using a listener that first holds known synced progress.
- Realtime is an acceleration path only. RPC generation/revision rules plus refetch/reload behavior remain the correctness boundary.

## Release History

### Audit and remediation baseline — 2026-07-09 to 2026-07-11

- `87ee196` — recorded the 51-finding full-project audit baseline
- `8a2a91f`, `03653da` — removed public personal data and corrected FAA regulatory/content issues
- `4241ed1` — repaired routes and exam/session persistence behavior
- `8705cf8`, `c7f23d5` — added deterministic FAA assessment construction, quiz modes, review gate, and answer review
- `4b946e2` — accessibility and mobile remediation
- `28fd6f3` — dashboard resume, weak-area links, study-plan feedback, and navigation improvements

The audit remains historical evidence. Its original findings should not be read as a current-state checklist without comparing later commits.

### Distribution, PWA/SEO, and design release

- `5354045` — shipped the production design plus PWA metadata/icons, SEO metadata, sitemap/robots behavior, and iOS safe-area work
- Custom production domain is `faa107training.org`
- Deliberate offline caching/update behavior and real-device iPhone/VoiceOver verification remain open; already-shipped manifest/SEO/safe-area work is not backlog

### Authentication

- `b8b100d` — deployed Supabase email/password and Google authentication
- `9bc762e` — hardened callback and form behavior
- Apple Sign In remains intentionally deferred
- Configuration notes: `docs/supabase-auth-configuration.md`

### Account-backed progress synchronization

- `ad59509` — database/RLS security foundation
- `d70e6e0` — canonical progress model
- `ab55654` — atomic progress RPCs
- `6ccfe35` — concurrent reset-race coverage
- `a167620` — account progress synchronization
- `1cfa8ec` — stale auth initialization guard
- `0cd316b` — sync status UI
- `f15f374` — reset guard during auth loading
- `411a2b7` — remote reset propagation repair

Deployment facts:

- Migration `supabase/migrations/20260712000000_account_progress_sync.sql` is applied to `qbeioesktbpvdlgzrgsm`.
- Anonymous progress remains browser-local and is not uploaded merely because Supabase exists.
- Authenticated caches and server data are user-scoped; switching accounts does not share progress.
- Signed-in progress restores across clean contexts and can be reset account-wide.

## Current Architecture

- Next.js 14 App Router, React 18, TypeScript 5.9, Tailwind CSS, Radix/shadcn UI, and Framer Motion
- Supabase SSR/client helpers for auth and session refresh
- Local synchronous storage funnel for learning UI, with canonical cache/merge/RPC/coordinator modules for authenticated sync
- PostgreSQL RLS and security-definer RPCs with revision and reset-generation safeguards
- Realtime Postgres Changes as non-authoritative refresh acceleration
- Node behavioral tests, Supabase SQL tests, and targeted browser proof

## Completed Product Scope

- 13-module curriculum, 250+ slides, quizzes, 61 flashcards, cram sheet, and 7/14-day study plans
- FAA-like timed practice exam plus broad practice drill
- Exact-slide resume, weak-area links, progress dashboard, and resumable exam sessions
- Responsive/mobile and accessibility remediation foundations
- PWA install metadata/icons, SEO metadata, sitemap/robots, and iOS safe-area styling
- Email/password and Google sign-in
- Local-first, user-isolated account progress sync with restore and reset

## Remaining Meaningful Work

Priority order is defined in `docs/superpowers/plans/2026-07-12-faa107-remaining-hardening-plan.md`:

1. Upgrade Next.js and related dependencies against current advisories; add and verify security headers.
2. Add content source/review-date governance and a repeatable freshness review.
3. Split module metadata from full curriculum bodies and measure bundle improvements.
4. Add deliberate offline caching/update behavior, then complete physical iPhone Safari/standalone/rotation and VoiceOver QA.
5. Perform the deferred Realtime open-tab soak observation with known pre-reset listener data.
6. Explore payment architecture only after explicit product approval; do not mix it into security or PWA hardening.

## Decisions and Boundaries

- Free platform today; monetization is unapproved future planning.
- Browser/PWA remains the primary distribution path; no native rewrite is planned.
- Apple Sign In is deferred.
- Active in-progress exam state remains device-local unless a later approved design changes that boundary.
- Regulatory-content changes require current FAA source verification and a recorded review date.
