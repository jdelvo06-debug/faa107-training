# FAA Part 107 Training Platform

Free, self-contained study platform for the FAA Part 107 remote pilot certification exam (UAG). Built for self-guided learners, classroom instructors, and Drone as a Service programs.

**Live:** [faa107-training.vercel.app](https://faa107-training.vercel.app)

---

## What's Included

- **13 modules** covering every ACS topic area — regulations, airspace, charts, weather, operations, ADM, physiology, maintenance, and career pathways
- **Slide viewer** — keyboard-navigable slide decks with 250+ slides, FAA chart images, source citations, exact-slide resume, and reduced-motion support
- **Quiz engine** — Study Mode (immediate feedback, changeable answers) and Assessment Mode (locked first answer, deferred scoring) per module
- **Practice exam** — two formats:
  - **FAA-like Timed Exam** — 60 questions, 120-minute timer, exact ACS topic distribution, deterministic three-choice presentation, first-answer locking
  - **Practice Drill** — broad random practice from the 158-question pool, canonical four-choice, untimed, changeable answers
- **61 flashcards** — per-module decks with flip animation, shuffle, and known/unknown tracking
- **Cram sheet** — one-page printable quick reference with Part 107 limits, airspace table, METAR/TAF decode, ACS breakdown, mobile-responsive
- **7-day and 14-day study plans** — structured day-by-day roadmaps with module completion checkmarks, day progress counts, and recommended-day highlighting
- **Dashboard** — exact-slide resume, weak-area study links to relevant modules, localStorage-based progress tracking, recent activity
- **Exam persistence** — resumable in-progress exams that survive refresh, with expired-session auto-completion and storage-denied fallback
- **Final review gate** — unanswered/flagged counts, submit confirmation dialog, and detailed post-exam answer review with explanations
- **Accessibility** — radio-group semantics, aria-live feedback, aria-labeled progress bars, 44px touch targets, prefers-reduced-motion support, scoped keyboard navigation
- **Mobile responsive** — works 320px and up, dark aviation theme, no horizontal overflow
- **44 behavioral regression tests** — package-free Node test runner

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion (reduced-motion aware) |
| Icons | Lucide React |
| Persistence | localStorage (no backend) |
| Charts | Public domain FAA chart excerpts |
| Testing | Node built-in test runner (`node --test`) |

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run behavioral tests
npm test
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with AppShell
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Progress dashboard with exact-slide resume
│   ├── modules/            # Module listing + [id] routes
│   │   └── [id]/           # Slides, quiz, flashcards per module
│   ├── exam/               # Practice exam chooser + results with answer review
│   ├── flashcards/         # All flashcards view
│   ├── cram-sheet/         # Printable quick reference (mobile-responsive)
│   ├── study-plan/         # 7 & 14-day plans with completion feedback
│   ├── resources/          # FAA links + built-in aids
│   └── about/              # Course info
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── app-shell.tsx       # Sidebar nav + layout shell
│   ├── slide-viewer.tsx    # Slide deck with keyboard nav + exact-slide resume
│   ├── quiz-engine.tsx     # Study/Assessment Mode quiz engine
│   ├── flashcard-deck.tsx  # Flip cards with progress
│   ├── practice-exam.tsx   # FAA Timed Exam / Practice Drill + review gate
│   ├── module-nav.tsx      # Module progress sidebar
│   └── dashboard-summary.tsx # Dashboard with resume + weak-area links
├── lib/
│   ├── course-data.ts      # All 13 modules' slide content
│   ├── questions.ts        # Quiz + exam question bank (158 Qs)
│   ├── flashcards.ts       # Flashcard data (61 cards)
│   ├── assessment-engine.ts # Deterministic FAA exam builder + presentation transform
│   ├── exam-session.ts     # Exam session persistence, restore, submission controller
│   ├── progress-storage.ts # localStorage progress + active exam sessions
│   ├── progress-selectors.ts # Resume target, weak areas, topic-module mapping
│   ├── acs-weights.ts      # Single source of truth for ACS topic weighting
│   ├── learning-routes.ts  # Shared route generation helpers
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Shared utilities + focus containment helper
├── tests/
│   ├── content-regressions.test.cjs  # Phase 1 content/privacy regression tests
│   ├── assessment-engine.test.cjs    # Phase 2B engine tests
│   ├── phase2a-core-flow.test.cjs    # Phase 2A/2B persistence + review tests
│   └── accessibility.test.cjs        # Phase 3A/3B helper tests
├── docs/
│   └── audits/
│       └── 2026-07-09-full-project-audit.md  # Full 51-finding audit report
└── public/
    └── images/charts/      # FAA sectional chart excerpts
```

## Content Sources

All course content is based on public domain FAA publications:

- 14 CFR Part 107 (operating rules)
- FAA Airman Certification Standards (ACS) for UAS
- FAA Aeronautical Chart User's Guide
- FAA Remote Pilot Study Guide
- FAA.gov official pilot certification pages

Chart images are extracted from public domain FAA publications.

## Remediation History

This platform underwent a full remediation cycle in July 2026 based on a 51-finding audit:

1. **Phase 1 — Trust & Accuracy:** Removed public personal data, corrected FAA regulatory content across all surfaces
2. **Phase 2A — Core Study Flow:** Fixed broken routes, stale exam scoring, added resumable exam persistence
3. **Phase 2B — Assessment Integrity:** Built deterministic FAA exam engine, Study/Assessment quiz modes, review gate, detailed answer review
4. **Phase 3A — Accessibility & Mobile:** Radio semantics, aria-live, reduced-motion, touch targets, scoped keyboard nav, mobile overflow fixes
5. **Phase 3B — Dashboard & Study-Plan UX:** Exact-slide resume, weak-area study links, completion feedback, secondary navigation

See `SESSION.md` for detailed commit history and `docs/audits/` for the full audit report.

## License

MIT — free to use, modify, and distribute.

---

Built for drone pilots, by people who actually fly drones.