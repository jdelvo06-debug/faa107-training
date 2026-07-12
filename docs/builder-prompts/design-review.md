# FAA 107 Front-End Design Review and Prototype Lab

## Context

- Repository: `/Users/jeremydelvaux/projects/FAA 107`
- Base branch: `codex/faa107-training-platform`
- Prototype branch: `codex/design-review`
- Live URL: `https://faa107training.org`
- Stack: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Framer Motion
- The platform has completed its remediation cycle. Phase 3A accessibility/mobile work and Phase 3B dashboard/study-plan behavior are already complete and must not be reopened or regressed.
- This task evaluates the visual system and explores a coherent next design direction. It does not authorize production changes.

## Mission

Complete this work in two stages:

1. Conduct an evidence-based design audit of the current product and recommend exactly three prototype directions.
2. After Jeremy approves the directions, build exactly three working prototypes in an isolated local design lab.

Do not combine the two stages. **Stop after Stage 1 and wait for Jeremy's explicit approval before creating a branch or writing prototype code.**

Do not commit, push, open a pull request, or deploy anything. The prototypes are for local browser review only.

## Non-Negotiable Boundaries

- Do not change existing learner-facing pages, components, application behavior, course data, assessment logic, persistence, navigation behavior, or regulatory content.
- Do not redesign or undo the completed Phase 3A accessibility/mobile work or Phase 3B dashboard/study-plan behavior.
- Do not add npm packages.
- Do not invent testimonials, pass rates, learner counts, success statistics, endorsements, certifications, or other social proof.
- Do not use the FAA seal, imply FAA sponsorship, or make the product appear to be an official FAA service.
- Use existing learner content exactly as the source for prototypes. Do not introduce or rewrite aviation/regulatory claims.
- Do not stash, reset, delete, overwrite, or otherwise disturb pre-existing user changes.
- Keep audit evidence and prototype recommendations distinct from confirmed accessibility compliance. Browser emulation does not prove physical-device or VoiceOver behavior.

## Stage 1 — Evidence-Based Design Audit

Stage 1 is audit-only. Do not create or switch branches, modify repository files, or begin implementation.

### 1. Preflight

Before reviewing the product:

1. Verify the exact repository path.
2. Run `git remote -v` and confirm the expected GitHub repository.
3. Run `git branch --show-current` and confirm the base branch.
4. Run `git status --short` and report the exact clean/dirty state.
5. Treat `docs/builder-prompts/design-review.md` as a pre-existing user file if it is still untracked. Do not edit, delete, stage, or commit it.
6. If any other unexpected changes exist, preserve them and call them out before continuing.

### 2. Review the Current Product

Review the live site at `https://faa107training.org` across these routes:

- `/` — landing page
- `/dashboard` — learner re-entry and progress
- `/modules` — module discovery
- `/modules/1` — slide viewer
- `/modules/2/quiz` — quiz engine
- `/exam` — exam chooser
- `/cram-sheet` — cram sheet
- `/study-plan` — study plan
- `/flashcards` — flashcards

Capture baseline evidence at:

- Desktop: `1440x900`
- Mobile: `390x844`

Capture both viewports for every route unless a route is blocked. Inspect each accepted screenshot and reject captures that are loading, blank, cropped, or showing the wrong state. If a route is blocked or state-dependent, report the exact limitation rather than inventing a representative state.

Keep audit screenshots outside the repository, such as `/tmp/faa107-design-review-baseline/`, so Stage 1 does not alter the working tree.

### 3. Read the Existing Visual System

Inspect the actual implementation before recommending changes:

- `app/globals.css`
- `components/app-shell.tsx`
- `components/ui/*`
- `tailwind.config.ts`
- `app/page.tsx`
- `components/slide-viewer.tsx`
- `components/practice-exam.tsx`
- `components/quiz-engine.tsx`

Also identify the existing course, question, progress, and flashcard data sources that prototypes would reuse. Verify filenames and exports before referencing them.

### 4. Audit Lenses

Evaluate:

- Task entry and discoverability
- Visual hierarchy and information density
- Typography scale and long-form readability
- Color, contrast, and use of the aviation theme
- Card/component spacing and rhythm
- Landing-page first impression and CTA hierarchy
- Learner re-entry and progress clarity
- Quiz and exam focus, answer states, timing, and reassurance
- Desktop/mobile consistency and responsive reflow
- Navigation hierarchy, active states, and orientation
- Empty, loading, completed, and error states visible in the current product
- Keyboard focus visibility, target size, reduced motion, and likely screen-reader risks
- Whether the "flight deck" metaphor supports comprehension or feels decorative/gimmicky
- Professional credibility versus hobbyist appearance
- Print usability for the cram sheet

Separate:

- Confirmed observations from captured evidence
- Code-supported findings
- Hypotheses that require usability or assistive-technology testing
- Structural issues from cosmetic polish

### 5. Optional Competitive Pattern Scan

Review two or three current FAA study or modern edtech products only if they sharpen a recommendation.

- Record the product, URL, and access date.
- Compare patterns such as hierarchy, progress communication, assessment focus, and trust signals.
- Do not copy branding or layouts.
- Do not treat competitor claims as verified facts.

### 6. Recommend Exactly Three Prototype Directions

The default set is:

1. **Landing Page Refresh** — Clearer value proposition, stronger CTA hierarchy, restrained aviation cues, and verified trust signals only.
2. **Dashboard Redesign** — A stronger resume action, scannable progress, and clearer weak-area remediation while preserving existing Phase 3B behavior.
3. **Exam Experience Polish** — A calm, focused, high-stakes assessment experience that improves orientation and answer-state clarity without implying FAA affiliation.

Treat navigation, typography, spacing, color, and component styling as one shared design direction demonstrated consistently across all three prototypes—not as separate prototype pages.

If the evidence strongly supports replacing one default prototype with modules, cram sheet, study plan, or flashcards, recommend the substitution and explain the trade-off. Do not make the substitution without Jeremy's approval.

### Stage 1 Return Format

Return:

1. Preflight result: path, remote, branch, and exact git status
2. Audit scope and evidence captured
3. Existing strengths worth preserving
4. Highest-impact UX and visual risks, prioritized by severity
5. Accessibility risks and explicit evidence limits
6. Exactly three recommended prototype directions, with rationale and trade-offs
7. Proposed shared design principles across the three prototypes
8. Confirmation that no branch was created and no repository files were changed
9. A direct request for Jeremy to approve or revise the three directions

**Stop here. Do not begin Stage 2 without explicit approval.**

## Stage 2 — Local Prototype Lab

Begin Stage 2 only after Jeremy explicitly approves the three prototype directions.

### 1. Recheck Repository State

1. Re-run `git remote -v`, `git branch --show-current`, and `git status --short`.
2. Confirm the base is `codex/faa107-training-platform` at the intended commit.
3. Preserve all pre-existing changes. If the working tree contains unexpected changes that could overlap this work, stop and report them.
4. If the only pre-existing change is the untracked `docs/builder-prompts/design-review.md`, leave it untouched and clearly distinguish it from prototype files in the final SITREP.

### 2. Create the Prototype Branch

- Create `codex/design-review` from the current intended commit on `codex/faa107-training-platform`.
- If `codex/design-review` already exists, do not delete, reset, or recreate it. Report its state and wait for direction.
- Do not commit or push the branch.

### 3. Build the Design Lab

Create a gallery at `/design-lab` linking to exactly three approved prototypes. Each prototype must live under `/design-lab/[name]`.

All prototype code must be added in new files under `app/design-lab/`. Do not modify existing pages, shared components, Tailwind configuration, or global CSS.

For each prototype:

1. Give it a clear name and route.
2. Build a complete, responsive page—not a static mockup or partial component.
3. Use actual content and imported data from the codebase; do not use lorem ipsum or duplicate source datasets.
4. Demonstrate the approved shared typography, color, spacing, navigation, and component direction.
5. Preserve the current product's functional meaning and learner workflows.
6. Include a concise explanation of what changed, what was intentionally preserved, and why the direction is stronger.
7. Include a link back to `/design-lab`.

Use only existing dependencies: Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, and Lucide icons.

### 4. Design and Accessibility Requirements

Every prototype must:

- Work without horizontal overflow at `390px`
- Reflow cleanly at `200%` browser zoom where practical
- Maintain visible keyboard focus
- Use appropriate semantic headings and control labels
- Provide clear selected, completed, disabled, and error states when those states appear
- Respect `prefers-reduced-motion`
- Avoid relying on color alone to communicate state
- Use contrast appropriate for readable learner content and interactive controls
- Avoid decorative aviation treatments that compete with comprehension
- Avoid unsupported trust claims or implied FAA affiliation

The cram sheet is not one of the default prototypes. If Jeremy approves it as a substitution, it must also have a usable print layout.

### 5. Verification

Run and read the actual results of:

1. `npm test`
2. `npm run lint`
3. `npm run build`

Then run the local development server and verify:

- `/design-lab`
- Each of the three prototype routes
- Desktop at `1440x900`
- Mobile at `390x844` for all three prototypes
- Keyboard navigation and visible focus on each prototype
- No horizontal overflow on any prototype
- Reduced-motion behavior where motion is used

Capture one accepted desktop screenshot and one accepted mobile screenshot for each prototype. Inspect each saved screenshot before accepting it.

Do not claim physical-device or VoiceOver verification unless it was actually performed. Browser viewport and media-query emulation must be labeled as simulated verification.

## Final SITREP

Return:

1. Branch created and base commit
2. Exact pre-existing working-tree changes preserved
3. Three prototypes built: name, route, and what each demonstrates
4. Shared design recommendations demonstrated across the prototypes
5. Test, lint, and build results with exact pass/fail status
6. Desktop/mobile/keyboard/reduced-motion verification performed
7. Evidence limits, including simulated versus physical-device checks
8. Local command and URL for reviewing `/design-lab`
9. Final `git status --short`
10. Confirmation that nothing was committed, pushed, or deployed
