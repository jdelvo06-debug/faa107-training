# FAA 107 — Session Tracking

## Current Status
- **Phase:** Remediation complete — Phases 0–3B pushed to GitHub
- **Last Updated:** 2026-07-11
- **Live URL:** [faa107-training.vercel.app](https://faa107-training.vercel.app)
- **Branch:** `codex/faa107-training-platform`
- **Test suite:** 44 behavioral tests (package-free Node test runner)
- **Build:** 52 static pages, clean lint, clean TypeScript

## Remediation History (2026-07-09 to 2026-07-11)

### Phase 0 — Audit Baseline
- Full code/content/UI/UX audit (51 findings: 16 P1, 24 P2, 7 P3, 4 observations)
- Audit report: `docs/audits/2026-07-09-full-project-audit.md`
- Commit: `87ee196`

### Phase 1 — Trust & Accuracy
- Removed all public personal data (TS/SCI claims, military biography, retirement timeline, owner name)
- Corrected FAA Part 107 content across all surfaces:
  - Weather minima (14 CFR §107.51)
  - Registration rules (all Part 107 drones must register, not just >0.55 lbs)
  - Alcohol/BAC rules (§107.27 + §91.17: 8 hours, BAC ≥0.04)
  - ACS weighting (single source of truth in `lib/acs-weights.ts`)
  - Category 3 operations-over-people eligibility
  - Exam reference guidance (FAA testing supplement)
- Added 7 content regression tests
- Commits: `8a2a91f`, `03653da`

### Phase 2A — Core Study Flow
- Fixed study-plan 404 links (numeric `/modules/<n>` routes)
- Fixed global flashcard dead activity route (`/modules/all/flashcards` → `/flashcards`)
- Fixed stale timer submission (used current answers/flags, not closure snapshot)
- Added resumable in-progress exam sessions (localStorage persistence)
- Added duplicate-submit protection (timer + manual race)
- Added storage-denied fallback (honest in-memory result, no crash)
- Added expired/legacy session handling
- Commits: `4241ed1`

### Phase 2B — Assessment Integrity
- **Slice 1 — Assessment engine** (`lib/assessment-engine.ts`)
  - Deterministic FAA-style 60-question builder with exact ACS distribution
  - Three-choice FAA presentation transform (keeps correct answer + 2 canonical distractors)
  - Broad Practice Drill preserves canonical four-choice content
  - Study vs Assessment quiz mode policies
  - Commit: `8705cf8`
- **Slice 2 — Assessment experience**
  - Module quiz mode selector (Study Mode / Assessment Mode)
  - Practice exam / drill chooser (FAA-like Timed Exam / Practice Drill)
  - FAA timed exam: 60 questions, 120 minutes, exact ACS, 3-choice, answer locking
  - Practice drill: broad pool, 4-choice, untimed, mutable answers
  - Versioned session persistence with presentation metadata
  - Final review gate with unanswered/flagged counts and submit confirmation
  - Detailed post-exam answer review with explanations
  - Variant-aware result messaging (exam vs drill vs legacy)
  - Accessible Radix Dialog for unanswered-submit confirmation
  - Legacy v1 session backward compatibility
  - Expired FAA session auto-completion from saved snapshot
  - Commit: `c7f23d5`

### Phase 3A — Accessibility & Mobile Polish
- Radio-group semantics for quiz/exam answer choices (fieldset, legend, role="radio", aria-checked)
- aria-live regions for quiz feedback announcements
- Progress bars expose aria-valuenow and aria-label
- 44×44px touch targets on slide jump indicators
- prefers-reduced-motion CSS overrides + Framer Motion useReducedMotion hook
- Arrow key navigation scoped to slide viewer container (no more global interception)
- Landing page mobile headline reduced, entrance animations bypassed on mobile
- Cram-sheet mobile horizontal overflow eliminated (responsive table reflow at 390px)
- Commit: `4b946e2`

### Phase 3B — Dashboard & Study-Plan UX
- Single "Resume Module X, slide Y" dashboard card (duplicate Continue removed)
- SlideViewer restores exact slide on mount via existing lastSlideId
- Weak areas link directly to relevant study modules
- Study-plan shows module completion checkmarks, day completion counts, and recommended-day highlight
- Resources and About added to primary navigation (desktop sidebar + mobile drawer)
- Removed dead `getContinueTarget` function and unused import
- Commit: `28fd6f3`

## What's Built
- [x] Full 13-module curriculum with 250+ slides
- [x] Quiz engine per module with Study Mode (immediate feedback) and Assessment Mode (locked answers)
- [x] Practice exam: FAA-like Timed Exam (60 questions, 120 min, exact ACS, 3-choice) + Practice Drill (broad pool, 4-choice, untimed)
- [x] 61 flashcards across all modules
- [x] Cram sheet — printable Part 107 quick reference, mobile-responsive
- [x] 7-day and 14-day study plans with completion feedback and recommended-day highlighting
- [x] Dashboard with exact-slide resume, weak-area study links, and localStorage progress tracking
- [x] Mobile-responsive dark aviation theme
- [x] Accessibility: radio semantics, aria-live, reduced-motion, 44px touch targets, scoped keyboard nav
- [x] Resumable exam sessions with storage-denied fallback
- [x] Final review gate with unanswered/flagged submit confirmation
- [x] Detailed post-exam answer review with explanations
- [x] 44 behavioral regression tests (package-free Node test runner)
- [x] Deployed to Vercel with auto-deploy on push
- [x] Resources and About in primary navigation

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI
- Framer Motion (with reduced-motion support)
- Client-side only, localStorage for progress
- No backend needed
- Package-free Node test runner (`node --test tests/*.test.cjs`)

## Key Decisions
- Free platform (not monetized yet)
- Target audience: both self-guided learners and classroom instructors
- Full package: slides, quizzes, flashcards, practice exams, cram sheet, study plans
- Mobile-friendly website (not native app)
- Module quizzes support both Study Mode and Assessment Mode
- Practice exams are hybrid: FAA-like Timed Exam + broad Practice Drill
- Originally built for Nd3 Inc SkillBridge interview demo (May 8, 2026)

## Next Steps — Phase 4 (Distribution)
- [ ] Purchase custom domain
- [ ] Configure custom domain on Vercel
- [ ] Add PWA manifest (`manifest.ts`), icons, theme color, display mode
- [ ] Add offline shell/curriculum caching strategy
- [ ] Add `robots.ts` and `sitemap.ts` for SEO
- [ ] Add per-route metadata (canonical, Open Graph, Twitter card)
- [ ] Add safe-area styles for iOS standalone mode
- [ ] Version and test local progress migrations
- [ ] Verify on actual iPhone Safari (standalone mode, rotation, VoiceOver)
- [ ] Consider Capacitor wrapper if App Store presence is desired
- [ ] Upgrade Vercel CLI (`npm i -g vercel@latest`)

## Known Backlog (non-blocking)
- Radio group roving tabindex / arrow-key navigation (Phase 3A P2)
- Arrow key filter for interactive elements inside slide container (Phase 3A P2)
- Adjacent slide indicator 44px hit area overlap (Phase 3A P2)
- Bundle/data split: separate lightweight module metadata from slide bodies (P-01)
- Content governance: centralize rule facts with source URLs and reviewed dates (T-02)
- CardTitle heading element ref type (T-03)
- Optimize chart images (P-03: 6.1 MB PNGs)