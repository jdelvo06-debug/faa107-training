# Complete the Modern Flight School Redesign

## Context

- Repository: /Users/jeremydelvaux/projects/FAA 107
- Branch: codex/design-review (currently has partial redesign)
- The "Modern Flight School" theme restyled 4 production pages (/, /dashboard, /exam, /exam/results) but left ~11 routes in the old dark aviation theme
- Two independent reviews found 3 P0, 5 P1, and 4 P2 issues
- The design direction is approved — warm cream/teal/coral palette, Avenir Next typography, professional flight-school aesthetic

## Mission

Complete the redesign: fix all P0/P1/P2 findings AND extend the Modern Flight School theme to every page in the application so there is no visual theme switch when navigating between routes.

Do NOT commit, push, deploy, reset, stash, or clean.
Do NOT add new npm packages.

## Preflight

Read before editing:
- AGENTS.md
- design-qa.md (the QA report from the initial redesign)
- components/modern-flight-school-shell.tsx
- components/modern-flight-school.module.css
- components/app-shell.tsx
- app/globals.css
- app/layout.tsx
- app/page.tsx
- components/dashboard-summary.tsx
- components/practice-exam.tsx
- app/exam/results/page.tsx
- components/slide-viewer.tsx
- components/quiz-engine.tsx
- components/flashcard-deck.tsx
- components/ui/button.tsx
- components/ui/badge.tsx
- components/ui/card.tsx
- components/ui/progress.tsx
- components/ui/dialog.tsx
- app/cram-sheet/page.tsx
- app/study-plan/page.tsx
- components/study-plan.tsx
- app/modules/page.tsx
- app/resources/page.tsx
- app/about/page.tsx
- app/flashcards/page.tsx
- components/module-nav.tsx

Run:
- git status --short --branch
- git remote -v

---

## P0 Fixes (Critical — must fix first)

### P0-1: Outline Button text invisible on cream surfaces

shadcn Button variant="outline" uses `text-foreground` which is `#f1f5f9` (near-white from old dark theme). On the new cream/paper surfaces this is 1.08:1 contrast — invisible.

Fix: Add CSS module overrides for outline buttons used on restyled pages. The `:global()` override pattern in modern-flight-school.module.css needs to catch `text-foreground` on Button outline variant. Alternatively, update the CSS variable `--foreground` in a scoped way for the new theme context.

The cleanest fix: when the ModernFlightSchoolShell is active, override the shadcn CSS variables (`--foreground`, `--border`, `--card`, `--card-foreground`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--secondary`, `--secondary-foreground`, `--popover`, `--popover-foreground`) to the new warm theme values. This way ALL shadcn components automatically render correctly on the new theme without needing individual overrides.

Suggested new variable values for the warm theme:
- `--background`: `#fffdf8` (flight-paper) or `#faf6ef` (flight-cream)
- `--foreground`: `#0a4642` (flight-teal) or `#1a2e2c` (dark teal)
- `--card`: `#ffffff` or `#fffdf8`
- `--card-foreground`: `#0a4642`
- `--border`: `rgba(10, 70, 66, 0.12)` or a warm gray border
- `--muted`: `#f5f0e8`
- `--muted-foreground`: `#5a6d69`
- `--accent`: `#e8f4f0` (pale teal tint)
- `--accent-foreground`: `#0a4642`
- `--secondary`: `#f5f0e8`
- `--secondary-foreground`: `#0a4642`
- `--popover`: `#fffdf8`
- `--popover-foreground`: `#0a4642`
- `--primary`: keep coral `#d94831` (darkened — see P1-2) or teal `#0a4642`
- `--primary-foreground`: `#ffffff`
- `--destructive`: keep or adjust for warm theme
- `--ring`: match focus color

### P0-2: Badge outline text invisible on results page

Same root cause as P0-1. Fixing the CSS variables (P0-1) should fix this automatically since Badge uses `text-foreground` for outline variant.

### P0-3: Submit-confirmation Dialog renders in old dark theme

Radix Dialog portals to document.body, outside any CSS module scope. The Dialog content uses hardcoded classes like `bg-aviation-panel`, `text-amber-50`.

Fix: Either:
1. Override the Dialog Content styles when on a restyled page (add the new theme CSS to a body-level class or use a wrapper)
2. Or update the Dialog component itself to use CSS variables instead of hardcoded color classes

The cleanest fix: if you scope the CSS variable overrides to the ModernFlightSchoolShell wrapper AND apply them to the Radix portal, the Dialog will inherit the new theme. Radix Dialog supports `modal={true}` which portals to body — you may need to add a class to body or use a Dialog Content className override.

Alternative: Update the practice-exam.tsx Dialog Content classes to use the new warm theme classes instead of `bg-aviation-panel` etc. This is simpler and more direct.

---

## P1 Fixes

### P1-1: Safe-area CSS on new shell

The ModernFlightSchoolShell header and content do not include `env(safe-area-inset-*)` padding. With `viewport-fit=cover` set in layout.tsx, the header will clip under the notch on iPhone.

Fix: Add safe-area insets to the new shell:
- Header: `padding-top: env(safe-area-inset-top)` on mobile
- Content: `padding-bottom: env(safe-area-inset-bottom)`, `padding-left: env(safe-area-inset-left)`, `padding-right: env(safe-area-inset-right)`
- Match the pattern from globals.css but in the CSS module

### P1-2: Coral CTA buttons fail WCAG AA

`#fff` on `#f56046` (flight-coral) = 3.16:1. Needs 4.5:1.

Fix: Darken the coral. A coral around `#c2421f` or `#b83a1a` should pass AA with white text. Calculate: white on `#b83a1a` is approximately 5.5:1. Keep the coral visual identity but darken it enough to pass. Update `--flight-coral` and `--flight-coral-dark` in the CSS module. If `--primary` uses coral, update that too.

### P1-3: Eyebrow text fails WCAG AA

`--flight-coral-dark` (`#d94831`) on cream/paper = 3.99:1. Needs 4.5:1.

Fix: Darken the eyebrow color. Use the same darkened coral from P1-2, or switch to `--flight-teal` (`#0a4642`) which passes at 10+ :1.

### P1-4: Blue link text fails WCAG AA

`--flight-blue` (`#277ebd`) on paper = 4.30:1. Needs 4.5:1.

Fix: Darken `--flight-blue` to approximately `#1a6a9e` or `#155e8e` to pass AA. Or switch links to teal.

### P1-5: Half-done design — extend theme to ALL pages

This is the big one. The following routes still use the old dark aviation theme and must be restyled:

1. `/modules` (module listing) — app/modules/page.tsx
2. `/modules/[id]` (slide viewer) — components/slide-viewer.tsx
3. `/modules/[id]/quiz` (quiz engine) — components/quiz-engine.tsx
4. `/modules/[id]/flashcards` (flashcard deck) — components/flashcard-deck.tsx
5. `/flashcards` (all flashcards) — app/flashcards/page.tsx
6. `/cram-sheet` — app/cram-sheet/page.tsx
7. `/study-plan` — app/study-plan/page.tsx + components/study-plan.tsx
8. `/resources` — app/resources/page.tsx
9. `/about` — app/about/page.tsx

For each page:
- Apply the warm cream/teal/coral theme
- Use the same CSS variable overrides as the fixed P0-1
- Keep the existing layout and functionality — this is a restyle, not a redesign
- Preserve all Phase 2B/3A/3B functionality (radio semantics, aria-live, completion feedback, etc.)
- Match the typography (Avenir Next fallbacks) and spacing from the restyled pages
- Ensure no horizontal overflow at 390px
- Ensure all shadcn components (Card, Button, Badge, Progress, Dialog) render correctly on the warm theme

The AppShell routing condition in app-shell.tsx currently switches between ModernFlightSchoolShell and old AppShell. The cleanest approach: make ModernFlightSchoolShell the ONLY shell for ALL routes. Remove the routing condition. Delete or deprecate the old AppShell. This eliminates the theme switch entirely.

If that's too risky, alternatively: apply the CSS variable overrides globally in globals.css so ALL pages get the warm theme. But the shell structure (sidebar vs horizontal nav) still differs, so the shell consolidation is the better approach.

### Module nav sidebar

The old AppShell has a sidebar with ModuleNav (course module list with progress). The new shell uses a horizontal top nav. You need to decide how module navigation works in the new shell:
- Option A: Add a collapsible module drawer to the new shell (like a mobile drawer but on desktop too)
- Option B: Keep a slim sidebar but restyle it to match the warm theme
- Option C: Move module navigation to the /modules page itself and remove it from the shell

Pick the option that best fits the Modern Flight School aesthetic. The old dark sidebar with all 13 modules listed was audit finding UX-05 — it was too much for the nav. A cleaner approach is likely better.

---

## P2 Fixes

### P2-1: Nav inconsistency between shells

If you consolidate to one shell (P1-5), this is resolved automatically. Ensure the final nav includes all important routes: Home, Modules, Flashcards, Exam, Dashboard, Study Plan, Cram Sheet, Resources, About.

### P2-2: Focus outline contrast

Darken `--flight-blue` (P1-4 fix should handle this) or use `--flight-teal` for focus outlines.

### P2-3: themeColor meta tag

Update `app/layout.tsx` viewport export: change `themeColor` from `#f59e0b` (old amber) to the new brand color (darkened coral or teal — whatever becomes the primary).

### P2-4: Dashboard prototype divergence

Update the design-lab dashboard prototype to match production, or note in design-qa.md that the prototype diverged. Low priority.

---

## Explicitly out of scope

Do NOT:
- Add new npm packages
- Change FAA instructional content
- Change quiz/exam logic, persistence, or scoring
- Change progress storage schema
- Remove or change the design-lab routes (keep them as reference)
- Commit, push, deploy, reset, stash, or clean

---

## Verification

Run fresh:
1. npm test
2. npm run lint
3. npm run build
4. git diff --check

Browser smoke at desktop 1440px and mobile 390x844:

### Theme consistency (critical)
- Navigate from / to /modules to /modules/1 to /modules/1/quiz to /flashcards to /exam to /dashboard to /cram-sheet to /study-plan to /resources to /about
- Verify NO theme switch anywhere — all pages should be warm cream/teal/coral
- Verify no horizontal overflow at 390px on any route

### P0 verification
- On /exam active exam: verify Previous/Next/Return buttons are readable (not invisible)
- On /exam/results: verify Badge topic labels are readable
- On /exam: trigger submit with unanswered questions — verify the confirmation dialog matches the warm theme

### P1 verification
- Check contrast ratios for: coral buttons, eyebrow text, blue links
- Verify safe-area CSS is present in the shell

### Functional verification
- Module quiz: Study Mode and Assessment Mode both work
- Exam: FAA Timed Exam launches, 3 choices, answer locking
- Exam: Review gate, submit confirmation, duplicate submit protection
- Dashboard: Resume label, weak-area links, reset progress
- Study plan: Completion checkmarks, day counts, recommended day
- Slide viewer: Arrow keys scoped, slide jump targets, reduced motion
- Flashcards: Flip, known/unknown tracking
- Cram sheet: No mobile overflow, responsive tables

### PWA verification
- /manifest.webmanifest still valid
- /robots.txt still valid
- /sitemap.xml still valid
- theme-color meta matches new brand color

---

## SITREP

Return:
1. Status
2. Exact files changed/created
3. P0 fixes and how each was resolved
4. P1 fixes and how each was resolved
5. P2 fixes and how each was resolved
6. Which pages were restyled (list all routes now on the new theme)
7. Shell consolidation approach (one shell or two)
8. Module navigation approach
9. WCAG contrast ratios after fixes (for coral, eyebrow, blue, button text)
10. Tests added (if any)
11. Verification matrix
12. Browser smoke results per route
13. Known limits
14. Git status and confirmation nothing was committed, pushed, or deployed