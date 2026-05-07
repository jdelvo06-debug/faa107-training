# FAA 107 — Codex Launch Prompt

Copy this entire block into Codex to start building.

---

## Project: FAA Part 107 Drone Pilot Training Platform

Build a mobile-friendly, self-contained website for FAA Part 107 remote pilot certification training. This is an MVP demo for a SkillBridge interview on Friday May 8, 2026 — needs to look polished and professional, but content depth can build over time.

---

## Tech Stack

**Use Next.js 14 with TypeScript (App Router), Tailwind CSS, and shadcn/ui components.** No backend — run entirely client-side with localStorage for progress tracking.

---

## Audience

- Self-guided learners studying at home
- Instructors who can use the slides/modules in a classroom setting
- Target company: Nd3 Inc (SDVOSB, military drone training, TRADOC-approved POIs)

---

## Curriculum Structure (13 Modules)

Build the navigation and skeleton for all modules. Fully implement modules 1-2 with real content. Stub out the rest with placeholder content that can be filled in later.

### Module 1: Welcome & Getting Started
- Course overview and how to use the platform
- What is Part 107 and who needs it
- Eligibility requirements (16+, English, physical/mental condition)
- Step-by-step: FTN → Knowledge Test → IACRA → Certificate
- Test format overview: 60 questions, 120 min, 70% to pass
- Glossary of key terms

### Module 2: FAA Regulations (Part 107 Rules)
- 14 CFR Part 107 overview and applicability
- Remote pilot certificate requirements
- Registration requirements (>0.55 lbs)
- Operating limitations (400 ft AGL, 100 mph, VLOS)
- Right of way rules
- Alcohol/drug rules (8 hours bottle to throttle)
- Night operation requirements (anti-collision lights, 3 SM visible)
- Operation over people (Categories 1-4)
- Accident reporting (10 days, serious injury or $500+ damage)
- Remote ID requirements
- Waivers and airspace authorizations (LAANC)

### Module 3: National Airspace System
- Airspace classes (B, C, D, E, G) — what they are, where they are, rules for each
- Special use airspace (MOAs, Restricted, Prohibited, Warning Areas)
- Military Training Routes (MTRs)
- TFRs and NOTAMs

### Module 4: Reading Sectional Charts
- Chart legend and basics
- Latitude and longitude
- Airport symbols and data blocks
- Airspace boundaries on charts
- MEFs (Maximum Elevation Figures)
- MSL vs AGL on charts
- Isogonic lines and magnetic variation
- Victor airways
- Common chart symbols and obstacles

### Module 5: Airport Operations
- Types of airports (towered vs non-towered)
- Runway markings and signage
- Traffic patterns
- Chart Supplement (formerly A/FD)
- Radio communication basics
- CTAF and UNICOM frequencies

### Module 6: Weather & Micrometeorology
- Standard atmosphere and pressure
- Density altitude and performance effects
- Wind (types, effects, shear)
- Clouds, ceilings, visibility
- Moisture, fog, frost
- Thunderstorms and extreme weather
- Stable vs unstable air
- Weather briefing sources (1800wxbrief.com, AviationWeather.gov)
- **Reading METARs** — full decode with examples
- **Reading TAFs** — full decode with examples

### Module 7: Drone Flight Operations
- Preflight planning and checklists
- Aircraft performance factors (weight, balance, battery, environment)
- Loading and center of gravity
- Emergency procedures
- Lost link / flyaway procedures
- Lithium battery safety and handling
- Hazardous operations to avoid

### Module 8: Aeronautical Decision-Making & CRM
- ADM process and models (DECIDE, PAVE, IMSAFE)
- Hazardous attitudes (Macho, Impulsivity, Invulnerability, Resignation, Anti-authority)
- Crew Resource Management
- Risk management matrix
- Human factors (fatigue, stress, medication)

### Module 9: Physiology
- Effects of drugs and alcohol
- Vision and visual illusions at night
- Hypoxia and hyperventilation
- Motion sickness
- Carbon monoxide

### Module 10: Maintenance & Preflight Inspection
- Preflight inspection checklist
- Maintenance requirements
- Condition for safe operation
- Battery care and storage
- Firmware updates

### Module 11: Practice Exams
- Full-length practice test (60 questions, 120 min timer, 70% pass threshold)
- Questions drawn from all ACS areas weighted per the real test:
  - Regulations: 15-25%
  - Airspace: 15-25%
  - Weather: 11-16%
  - Loading & Performance: 7-11%
  - Operations: 35-45%
- Answer explanations shown after each question
- Score tracking and weak-area identification
- At least 20 real-style questions implemented for the demo

### Module 12: Practical Flight Skills
- Drone hardware overview and controls
- Basic flight maneuvers
- Intelligent flight modes
- Camera settings for photo/video
- Flight sim integration notes

### Module 13: Industry Pathways & Careers
- Real estate, construction, energy, agriculture, public safety
- Starting a drone services business
- Insurance and liability
- Portfolio building
- Job search resources

---

## Features to Implement

### Navigation
- Clean sidebar or top navigation showing all 13 modules
- Progress indicator per module (not started / in progress / completed)
- Mobile hamburger menu

### Slide Viewer
- Each module has a slide-deck style view
- Left/right navigation between slides
- Slide counter (e.g., "Slide 3 of 12")
- Slides can contain text, images, diagrams, tables
- Support for embedded YouTube/Vimeo videos

### Flashcards
- Flashcard component with front/back flip animation
- Per-module flashcard decks
- Shuffle mode
- Track known/unknown cards

### Quizzes
- Per-module knowledge checks (5-10 questions each)
- Multiple choice, single correct answer
- Immediate feedback after answering
- Score at end
- Can retake

### Practice Exam Mode
- 60 questions, 120-minute countdown timer
- Random question order
- Flag for review feature
- Score with pass/fail
- Breakdown by topic area

### Progress Tracking (localStorage)
- Track which slides visited per module
- Track quiz scores
- Track practice exam scores and history
- Visual progress bar on dashboard

### Dashboard
- Overall course progress percentage
- Recent activity
- Weak areas (based on quiz performance)
- Quick links to continue where you left off

### Design
- Dark blue / aviation theme with orange accents
- FAA-style clean, professional look but modern
- Mobile responsive down to 320px width
- Accessible (good contrast, keyboard navigable)
- Fast page loads (static generation where possible)

---

## Pages to Build

| Route | Description |
|-------|-------------|
| `/` | Landing page — course overview, CTA to start |
| `/dashboard` | Progress overview for returning users |
| `/modules` | Module listing with progress indicators |
| `/modules/[id]` | Module slide viewer |
| `/modules/[id]/quiz` | Module quiz |
| `/modules/[id]/flashcards` | Flashcard deck |
| `/flashcards` | All flashcard decks |
| `/exam` | Full-length practice exam |
| `/exam/results` | Exam results with topic breakdown |
| `/resources` | Downloads (cheatsheets, ACS PDF, study guide) |
| `/about` | About the course / instructor |

---

## Development Priorities (in order)

1. **Project scaffold** — Next.js 14, Tailwind, shadcn/ui, folder structure
2. **Navigation and layout** — responsive shell with module nav
3. **Module 1 & 2 full content** — slides with real, accurate FAA content
4. **Slide viewer component** — clean, functional, mobile-friendly
5. **Quiz component** — working multiple choice with scoring
6. **Practice exam** — at least 20 questions, timer, scoring
7. **Flashcard component** — flip animation, per-module decks
8. **Dashboard** — localStorage-based progress
9. **Landing page** — polished, interview-ready
10. **Polish** — animations, transitions, loading states, mobile QA

---

## Content Rules

- All FAA regulatory content must be accurate per current 14 CFR Part 107
- Use real FAA terminology (ACS, NOTAM, METAR, TAF, LAANC, etc.)
- Include practical examples and "why this matters" context
- Keep tone professional but approachable
- Credit sources where using FAA materials (they're public domain)

## File Structure

```
faa107/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Landing
│   ├── dashboard/
│   │   └── page.tsx
│   ├── modules/
│   │   ├── page.tsx          # Module listing
│   │   └── [id]/
│   │       ├── page.tsx      # Slide viewer
│   │       ├── quiz/
│   │       │   └── page.tsx
│   │       └── flashcards/
│   │           └── page.tsx
│   ├── flashcards/
│   │   └── page.tsx
│   ├── exam/
│   │   ├── page.tsx
│   │   └── results/
│   │       └── page.tsx
│   ├── resources/
│   │   └── page.tsx
│   └── about/
│       └── page.tsx
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── navigation.tsx
│   ├── slide-viewer.tsx
│   ├── quiz-engine.tsx
│   ├── flashcard-deck.tsx
│   ├── exam-timer.tsx
│   ├── progress-bar.tsx
│   └── dashboard.tsx
├── lib/
│   ├── modules.ts            # Module data & content
│   ├── questions.ts          # Quiz & exam question bank
│   ├── flashcards.ts         # Flashcard data
│   └── storage.ts            # localStorage helpers
├── public/
│   └── images/
└── styles/
    └── globals.css
```

---

## Success Criteria for Friday

- Launchable on Vercel (or just running locally on the Mac Mini for demo)
- Modules 1-2 have full, accurate slide content
- Quiz component works with at least 10 questions across modules 1-2
- Practice exam works with 20+ questions
- Flashcards work with at least one full deck
- Dashboard shows real progress
- Looks professional on both desktop and mobile
- No broken links or 404s
- Builds and runs without errors
