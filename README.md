# FAA Part 107 Training Platform

Free, self-contained study platform for the FAA Part 107 remote pilot certification exam (UAG). Built for self-guided learners, classroom instructors, and Drone as a Service programs.

**Live:** [faa107.vercel.app](https://faa107.vercel.app) (coming soon)

---

## What's Included

- **13 modules** covering every ACS topic area — regulations, airspace, charts, weather, operations, ADM, physiology, maintenance, and career pathways
- **Slide viewer** — keyboard-navigable slide decks with 100+ slides, FAA chart images, and source citations
- **Quiz engine** — multiple-choice knowledge checks per module with immediate feedback and explanations
- **Practice exam** — 60 random questions drawn from a pool of 106, 120-minute timer, topic breakdown
- **61 flashcards** — per-module decks with flip animation, shuffle, and known/unknown tracking
- **Cram sheet** — one-page printable quick reference with Part 107 limits, airspace table, METAR/TAF decode, ACS breakdown
- **7-day and 14-day study plans** — structured day-by-day roadmaps
- **Dashboard** — localStorage-based progress, weak area identification, recent activity
- **Mobile responsive** — works 320px and up, dark aviation theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Persistence | localStorage (no backend) |
| Charts | Public domain FAA chart excerpts |

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
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with AppShell
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Progress dashboard
│   ├── modules/            # Module listing + [id] routes
│   │   └── [id]/           # Slides, quiz, flashcards per module
│   ├── exam/               # Practice exam + results
│   ├── flashcards/         # All flashcards view
│   ├── cram-sheet/         # Printable quick reference
│   ├── study-plan/         # 7 & 14-day study plans
│   ├── resources/          # FAA links + built-in aids
│   └── about/              # Course info
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── app-shell.tsx       # Sidebar nav + layout shell
│   ├── slide-viewer.tsx    # Slide deck with keyboard nav
│   ├── quiz-engine.tsx     # Multiple-choice quiz engine
│   ├── flashcard-deck.tsx  # Flip cards with progress
│   ├── practice-exam.tsx   # 60-question timed exam
│   ├── module-nav.tsx      # Module progress sidebar
│   └── dashboard.tsx       # Dashboard summaries
├── lib/
│   ├── course-data.ts      # All 13 modules' slide content
│   ├── questions.ts        # Quiz + exam question bank (106 Qs)
│   ├── flashcards.ts       # Flashcard data (61 cards)
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Shared utilities
│   └── storage.ts          # localStorage helpers
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

## License

MIT — free to use, modify, and distribute.

---

Built for drone pilots, by people who actually fly drones.
