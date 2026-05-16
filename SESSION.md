# FAA 107 — Session Tracking

## Current Status
- **Phase:** Production — Live on Vercel
- **Last Updated:** 2026-05-16
- **Live URL:** [faa107-training.vercel.app](https://faa107-training.vercel.app)

## What's Built
- [x] Full 13-module curriculum with 250+ slides
- [x] Quiz engine per module with immediate feedback
- [x] Practice exam: 60 random questions from 158-question pool (100 exam-* + 58 module spread)
- [x] 61 flashcards across all modules
- [x] Cram sheet — printable Part 107 quick reference
- [x] 7-day and 14-day study plans
- [x] Dashboard with localStorage progress tracking
- [x] Mobile-responsive dark aviation theme
- [x] Deployed to Vercel with auto-deploy on push

## Recent Changes
- **2026-05-16:** Expanded practice exam pool from 48 to 100 exam-* questions (52 added). Live pool now 158 total. Fixes forced overlap when drawing 60 questions.
- **2026-05-07:** Added phase grouping to module sidebar, cockpit bezel dashboard styling, key takeaway strips, animated slide transitions, hero page animations.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Client-side only, localStorage for progress
- No backend needed

## Key Decisions
- Free platform (not monetized yet)
- Target audience: both self-guided learners and classroom instructors
- Full package: slides, quizzes, flashcards, practice exams, cram sheet, study plans
- Mobile-friendly website (not native app)
- Originally built for Nd3 Inc SkillBridge interview demo (May 8, 2026)

## Open Questions
- Should module quiz questions be integrated into the practice exam pool directly (instead of just via spread)?
- Content expansion: add more chart-reading questions, weather scenario questions, and practical flight planning scenarios
- Consider GitHub Pages or custom domain for a cleaner URL
