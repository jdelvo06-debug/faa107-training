# FAA Part 107 Training Platform

Free study platform for the FAA Part 107 remote pilot certification exam (UAG), built for self-guided learners, classroom instructors, and Drone as a Service programs.

**Production:** [faa107training.org](https://faa107training.org)
**Production branch:** `codex/faa107-training-platform`
**Deployed application commit:** `f4493c9`

## Current Status

- The 13-module curriculum, quizzes, flashcards, cram sheet, study plans, dashboard, and FAA-like practice exam are live.
- PWA metadata/icons, SEO metadata, sitemap/robots support, iOS safe-area styling, and versioned offline caching are live. Physical iPhone/VoiceOver QA remains pending.
- Supabase Auth is live with email/password and Google OAuth (`b8b100d`, hardened in `9bc762e`). Apple Sign In is deferred.
- Account progress sync is live through `411a2b7`. Migration `20260712000000_account_progress_sync.sql` is applied to Supabase project `qbeioesktbpvdlgzrgsm`.
- Anonymous learning remains local-only. Signed-in progress is stored in a user-scoped account record, restored across clean browser contexts, isolated between accounts, and removable with the account-wide reset control.
- Real-browser proof passed for sync, restore, account isolation, and reset. The final live Realtime open-tab propagation retest was inconclusive because the listener had no pre-reset record; treat it as a deferred soak observation, not a verified pass. Correctness remains RPC/refetch based rather than dependent on Realtime delivery.
- The current production hardening train includes Next.js 15.5.20, report-only browser security headers, FAA content governance, and a split between lightweight course metadata and route-scoped lesson bodies.

## What's Included

- **13 modules** covering the ACS topic areas, with 250+ slides, FAA chart excerpts, citations, exact-slide resume, and reduced-motion support
- **Module quizzes** with Study Mode and locked-answer Assessment Mode
- **Practice exam** with a 60-question, 120-minute FAA-like format and a broad untimed Practice Drill drawn from the 158-question bank
- **61 flashcards**, a printable cram sheet, and 7-day/14-day study plans
- **Dashboard** with exact-slide resume, weak-area links, recent activity, and sync status for signed-in learners
- **Resumable exams**, final review gate, and detailed answer review
- **Responsive and accessible foundations** including semantic answer groups, live-region feedback, 44px targets, reduced-motion support, and scoped keyboard navigation
- **Installability/offline foundations** including web manifest, branded icons, metadata, sitemap, robots, iOS safe-area styling, versioned same-origin course caching, and an honest offline fallback

## Architecture

| Layer | Technology / behavior |
|---|---|
| Web application | Next.js 15.5.20 App Router, React 18, TypeScript 5.9 |
| UI | Tailwind CSS, shadcn/ui/Radix UI, Framer Motion, Lucide React |
| Authentication | Supabase Auth: email/password and Google OAuth |
| Anonymous progress | Browser local storage only; no anonymous progress row is created remotely |
| Account progress | Local-first cache plus Supabase PostgreSQL RPCs, RLS, revision/reset-generation controls, and Realtime as a non-authoritative refresh accelerator |
| Database migration | `supabase/migrations/20260712000000_account_progress_sync.sql` |
| Tests | Node built-in test runner, SQL database tests, and targeted browser verification |
| Hosting | Vercel production at `faa107training.org` |
| Content governance | Reviewed FAA/eCFR registry at `lib/regulatory-sources.ts`; process documented in `docs/content-governance.md` |
| Offline boundary | Same-origin shell/course assets only; auth, OAuth, Supabase, and account data are never cached |

Key progress modules live in `lib/progress-storage.ts`, `lib/progress-cache.ts`, `lib/progress-merge.ts`, `lib/progress-rpc.ts`, and `lib/progress-sync.ts`. Supabase client/server helpers live under `lib/supabase/`; auth UI/session wiring lives under `app/auth/`, `app/login/`, `app/signup/`, and `components/auth-provider.tsx`.

## Quick Start

```bash
npm install
npm run dev
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Open [http://localhost:3000](http://localhost:3000). Local authentication requires the public Supabase variables documented in [`docs/supabase-auth-configuration.md`](docs/supabase-auth-configuration.md); never add a service-role key to the application.

## Content Sources

Course content is based on public FAA sources, including 14 CFR Part 107, the UAS Airman Certification Standards, the Aeronautical Chart User's Guide, the Remote Pilot Study Guide, and FAA pilot-certification guidance. Chart excerpts are from public-domain FAA publications.

The July 9 audit in [`docs/audits/2026-07-09-full-project-audit.md`](docs/audits/2026-07-09-full-project-audit.md) is a point-in-time historical baseline; many findings were remediated after it was written. Use `SESSION.md` and the current remaining-work plan for present status.

## Current Roadmap

1. Complete physical iPhone Safari, installed-PWA, rotation, and VoiceOver validation using `docs/pwa-device-qa-checklist.md`.
2. Perform the deferred Realtime open-tab reset soak with known pre-reset progress using `docs/realtime-reset-soak-checklist.md`.
3. Continue quarterly/event-triggered FAA source freshness reviews via `docs/content-governance.md`.
4. Payment/subscription planning is deferred; no payment implementation is planned until Jeremy explicitly reopens it.

See [`docs/superpowers/plans/2026-07-12-faa107-remaining-hardening-plan.md`](docs/superpowers/plans/2026-07-12-faa107-remaining-hardening-plan.md) for phased scope, approval gates, and done standards.

## License

MIT — free to use, modify, and distribute.
