# FAA 107 Full Project Audit

Audit date: 2026-07-09  
Repository: `https://github.com/jdelvo06-debug/faa107-training`  
Local checkout: `/Users/jeremydelvaux/projects/FAA 107`  
Live site: `https://faa107-training.vercel.app/`  
Audited branch: `codex/faa107-training-platform`  
Audit mode: Read-only, evidence-driven source, build, live-browser, mobile, content, dependency, SEO, PWA, accessibility, and UX review.

## Executive Verdict

- Overall health: **Yellow**
- Ship-readiness: **Hold**
- Top issues:
  1. Correct verified FAA-content errors: Class G weather minima, Part 107 registration threshold, alcohol/BAC rule, ACS weighting, testing supplements, and operations-over-people language.
  2. Repair assessment integrity: timed-exam stale score, missing exam persistence/review, answer-position bias, answer changing after feedback, and unstratified exam generation.
  3. Remove public personal/clearance/retirement content and fix broken study-plan and flashcard activity routes.

### What is working especially well

- Production build, TypeScript, and ESLint pass.
- All 52 static pages generate successfully.
- The visual system is cohesive, legible, and more trustworthy than a generic template.
- Desktop and 390x844 mobile layouts showed no page-level horizontal overflow.
- The 158-question pool has unique IDs, valid answer indexes, nonempty explanations, and no exact duplicate prompts.
- React rendering avoids unsafe HTML; no backend, authentication, user uploads, or secret-dependent runtime was found.

The technical foundation is serviceable. The product is not ready to be promoted as a reliable FAA study resource until the content and assessment defects are resolved.

## Verification Performed

| Command/action | Result | Concise real result | Limits/blockers |
|---|---|---|---|
| Read `AGENTS.md`, `SESSION.md`, package/configuration, routes, components, data, and research | Pass | Verified repo scope, operating constraints, architecture, and claimed feature inventory | `SESSION.md` contains stale product claims |
| `git remote -v`, branch/status/log/diff | Pass | Correct repo; branch was one commit ahead of origin; the ahead commit only added `AGENTS.md` | Live deployment exposes no commit identifier, but observed live chunk hashes matched the local production build |
| `npm run lint` | Pass | No ESLint warnings or errors | Uses the older `next lint` workflow |
| `npx tsc --noEmit --incremental false` | Pass | Zero TypeScript errors | No dedicated typecheck script |
| `npm run build` | Pass | 52 static/SSG pages generated; first-load JS ranged from 87.5-157 kB | Build regenerated ignored `.next` output |
| Existing automated tests | Not available | No unit, integration, Playwright configuration, or test files found | `@playwright/test` is installed but unused |
| `npm audit --omit=dev --json` | Fail | One high and one moderate production vulnerability chain, rooted in Next.js 14.2.35 and bundled PostCSS | Static deployment reduces reachability for several listed advisories; it does not make the outdated dependency acceptable |
| Structural content script | Mixed | 13 modules, 118 slides, 158 exam-pool questions, 61 flashcards; no invalid IDs/indexes | Contradicts “250+ slides”; modules 12-13 have zero quiz questions and zero flashcards |
| Question-distribution script | Fail | Correct positions: A=16, B=111, C=30, D=1; 70.3% of correct answers are B | Semantic correctness was manually sampled, not independently verified for all 158 questions |
| Live internal-link crawl | Fail | 62 routes/links checked; all 13 `/modules/module-*` study-plan links returned 404 | Client-generated localStorage activity links required interactive testing |
| Landing/dashboard/module smoke | Mixed | Navigation works; visited-slide progress persists; dashboard updates after refresh | Reopening a module always returns to slide 1 |
| Module quiz smoke | Fail | Feedback and retake work, but a wrong answer can be changed after the explanation reveals the right answer | One six-question module completed end-to-end |
| Flashcard smoke | Fail | Flip, marking, shuffle, and persistence work | Same card counted twice across global and module decks; global activity stores a broken route |
| Practice-exam smoke | Fail | 60 questions generated, flagging/scoring/results/retake render | Incomplete exam submits immediately; refresh loses the entire attempt; no answer review exists |
| Timed-exam source inspection | Fail | Interval callback captures initial `score`, `flags`, and answers | Waiting 120 minutes was unnecessary because the stale closure is explicit in source |
| Desktop rendered inspection | Mixed | No framework overlay or relevant app console errors | Print mode was not rendered |
| 390x844 mobile inspection | Mixed | No horizontal overflow; navigation drawer and core flows render | In-app Chromium, not physical iPhone Safari/WebKit |
| Keyboard inspection | Fail | Pressing Arrow Right while the Flashcards link is focused advances the lesson slide | Broader screen-reader testing was not available |
| Accessibility console inspection | Fail | Opening the mobile drawer logs missing Dialog description/`aria-describedby` | No automated axe scan |
| SEO/PWA endpoint inspection | Fail | `/robots.txt`, `/sitemap.xml`, manifests, favicon, and Apple touch icon all return 404 | Search-engine indexing was not externally measured |
| Official regulatory verification | Pass | Compared flagged claims with current eCFR, FAA ACS, registration guidance, sample-question material, and certificate guidance | This is an audit, not legal advice or an FAA endorsement |
| Final audit worktree check | Pass | No tracked or untracked audit changes remained after the read-only run | Browser test progress was reset to its initial empty state |

## Findings

### Functional / Logic

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| F-01 | P1 High | Study-plan navigation | `app/study-plan/page.tsx:118-160`; every `/modules/module-1` through `/modules/module-13` link returned 404 | The primary action in both study plans is broken | Use `Link href={\`/modules/${m}\`}` and add a route-crawl test | Small |
| F-02 | P1 High | Timed exam | `components/practice-exam.tsx:41-57` | On timeout, `submitExam()` uses the effect's initial closure, recording a zero score and zero flags regardless of later answers | Move current answers/flags into refs or make submission derive from immutable exam state; test with fake timers | Medium |
| F-03 | P1 High | Flashcard activity | `app/flashcards/page.tsx:4-5`; `components/flashcard-deck.tsx:42-51` | Global-deck activity stores `/modules/all/flashcards`, which does not exist and can become the dashboard Continue destination | Pass an explicit activity URL separate from the progress namespace | Small |
| F-04 | P2 Medium | Lesson resume | `components/slide-viewer.tsx:117-141`; `lib/progress-storage.ts:89-104` | `lastSlideId` is stored but never used; refresh and dashboard Continue reopen slide 1 | Initialize the slide index from stored `lastSlideId` and include a slide anchor/query in activity URLs | Small |
| F-05 | P2 Medium | Quiz scoring | `components/quiz-engine.tsx:107-130`; live wrong-to-correct reproduction | Students can change answers after seeing the explanation, producing a false 100% result | Lock first attempts or separate graded attempt and study mode explicitly | Small |
| F-06 | P2 Medium | Exam submission/review | `components/practice-exam.tsx:154-162`; `app/exam/results/page.tsx:33-80` | Submit is always enabled, has no incomplete-answer confirmation, and results cannot review questions or explanations | Submit through an unanswered/flagged summary confirmation; persist question IDs and answers for review | Medium |
| F-07 | P2 Medium | Reset behavior | `components/dashboard-summary.tsx:40-43` | One click permanently clears all local progress with no confirmation or undo | Use the existing Dialog component for confirmation and optionally support short-lived undo/export | Small |

### Content / FAA Accuracy Risk

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| C-01 | P1 High | Weather minima | `app/cram-sheet/page.tsx:168-177`; [14 CFR 107.51](https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-107/subpart-B/section-107.51) | The cram sheet inserts manned-aircraft Class G VFR minima into Part 107 guidance. Part 107 requires at least 3 SM visibility and 500 ft below/2,000 ft horizontal cloud clearance without that Class G exception | Remove the Class G day/night rows and cite section 107.51 directly | Small |
| C-02 | P1 High | Registration | `lib/course-data.ts:263-280`; `app/cram-sheet/page.tsx:31`; `research/regulations.md:60`; [FAA registration FAQ](https://www.faa.gov/faq/do-i-need-register-my-drone-and-if-so-how-do-i-register) | “Required if >0.55 lbs” incorrectly applies the recreational threshold to Part 107. FAA says all drones operated under Part 107 must be registered | Correct all three surfaces and add a regression assertion | Small |
| C-03 | P1 High | Alcohol rule | `lib/course-data.ts:2284-2305`; `lib/questions.ts:401-407`; `lib/flashcards.ts:334-338`; [14 CFR 107.27](https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-107/subpart-B/section-107.27); [14 CFR 91.17](https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-91/subpart-A/section-91.17) | “BAC does not matter” is false. Part 107 incorporates section 91.17, including the independent 0.04 concentration prohibition | Rewrite the lesson, question explanation, and flashcard to list all four prohibitions | Small |
| C-04 | P1 High | ACS weighting | `lib/course-data.ts:2764-2786`; `lib/questions.ts:500-506`; `lib/flashcards.ts:418-422`; [FAA UAS ACS](https://www.faa.gov/sites/faa.gov/files/training_testing/testing/acs/uas_acs.pdf) | These surfaces say Regulations + Airspace are 55-75%; the current FAA ACS lists 15-25% each and Operations at 35-45%. The cram sheet elsewhere contains the current values | Make the ACS table the single source of truth used by lessons, cards, questions, and exam generation | Medium |
| C-05 | P1 High | Test procedure | `lib/course-data.ts:2742-2752`; [FAA UAG sample questions](https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/uag_questions.pdf) | “No reference materials...everything from memory” is misleading; the FAA testing system uses a supplied knowledge-test supplement for figure-based UAG questions | Explain what the testing supplement is, what is provided, and what personal materials remain prohibited | Small |
| C-06 | P1 High | Operations over people | `app/cram-sheet/page.tsx:30-35`; [14 CFR Part 107 Subpart D](https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-107/subpart-D) | The single parenthetical conflates Category 1-4 requirements and open-air assembly restrictions; Category 3 and declaration/label/Remote ID constraints are missing | Replace it with a concise category table sourced from Subpart D | Medium |
| C-07 | P2 Medium | Regulatory precision | `app/cram-sheet/page.tsx:24-34`; `app/cram-sheet/page.tsx:150-157`; [FAA certificate guidance](https://www.faa.gov/faq/i-dont-see-expiration-date-my-part-107-remote-pilots-certificate-do-i-have-take-test-annually) | “Max weight 55 lbs” should be “less than 55”; “Renewal” implies certificate expiration when the certificate is permanent and knowledge recency must be maintained | Tighten terminology and add direct rule/source links | Small |
| C-08 | P2 Medium | Unsupported absolutes | `lib/course-data.ts:2637-2639`; `app/study-plan/page.tsx:53` | “FAA assumes you did no maintenance” and “guaranteed exam material” are unsupported, adversarial-sounding claims that reduce trust | Reframe as professional best practice and likely/high-value study material; avoid guarantees | Small |

### State / Data Integrity

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| S-01 | P1 High | Exam persistence | `components/practice-exam.tsx:26-34`; live answer-refresh reproduction | Refreshing or navigating away from a two-hour exam loses the pool, answers, flags, index, and timer | Persist a versioned in-progress attempt with generated question IDs and an absolute start/deadline timestamp | Medium |
| S-02 | P1 High | Flashcard totals | `lib/progress-selectors.ts:61-69`; `components/flashcard-deck.tsx:15-22` | Reviewing FTN globally and in Module 1 produced `2/61` for one unique card; totals can exceed 61 | Store one canonical progress record per card ID, independent of deck view | Medium |
| S-03 | P2 Medium | Storage resilience | `lib/progress-storage.ts:31-44`; `lib/progress-storage.ts:60-67` | Normalization is shallow; malformed/old localStorage can reach selectors as invalid shapes. Writes are uncaught and can crash on quota/storage denial | Add schema validation/migration and catch writes with a visible nonblocking warning | Medium |
| S-04 | P2 Medium | Product inventory | `SESSION.md:8-16`; `app/modules/page.tsx:12-16` | Claims say “250+ slides” and all modules have quizzes/flashcards; runtime inventory is 118 slides, and modules 12-13 show “coming soon” | Generate counts from data or correct the copy and session handoff | Small |
| S-05 | P1 High | Exam validity | `lib/questions.ts`; structural audit | 111/158 correct answers are choice B; answer choices are never shuffled | Use seeded Fisher-Yates shuffling per question and remap `correctIndex`; test every generated exam | Medium |
| S-06 | P2 Medium | Exam composition | `components/practice-exam.tsx:22-28`; live attempt produced 51.7% Operations, 11.7% Regulations, and 5% Loading | Unstratified random sampling can materially diverge from current ACS ranges despite “same format” copy | Generate by ACS topic quotas, then shuffle the assembled 60-question set | Medium |

### Accessibility

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| A-01 | P1 High | Assessment controls | `components/quiz-engine.tsx:107-130`; `components/practice-exam.tsx:127-140` | Choices are plain buttons with color/icon-only selected/correct states; no radio semantics, `aria-pressed`, or live feedback | Use fieldset/radio-group semantics or explicit pressed/selected state; announce correctness/explanation through `aria-live` | Medium |
| A-02 | P2 Medium | Progress bars | `components/ui/progress.tsx:7-19` | `value` is removed before props reach the Radix root; live DOM exposed progress bars without `aria-valuenow` or labels | Forward `value`, `aria-label`, and `aria-valuetext` | Small |
| A-03 | P2 Medium | Touch targets | `components/slide-viewer.tsx:241-248`; measured at 32x10 px on 390x844 | Slide jump controls are difficult to tap and below practical mobile target size | Keep the visual rail but provide at least a 44x44 hit area around each indicator | Small |
| A-04 | P2 Medium | Reduced motion | `app/globals.css:54-76`; `components/slide-viewer.tsx:193-202` | Infinite drift/pulse and slide transitions ignore `prefers-reduced-motion` | Disable CSS animations and use Framer Motion's reduced-motion preference | Small |
| A-05 | P2 Medium | Keyboard behavior | `components/slide-viewer.tsx:143-156`; Arrow Right on focused Flashcards link advanced the lesson | Global arrow interception changes content while users interact with unrelated controls | Ignore events from interactive elements and document keyboard shortcuts | Small |
| A-06 | P3 Low | Semantics | `components/ui/sheet.tsx:26-51`; `app/modules/[id]/flashcards/page.tsx:18-29`; `components/ui/card.tsx:22-25` | Mobile dialog logs a missing description; module flashcards render two H1s; exam entry/results have no H1 | Add `SheetDescription`, normalize one page H1, and allow contextual card-title heading levels | Small |

### Mobile / Responsive

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| M-01 | P2 Medium | Landing page | `app/page.tsx:19-41`; `app/globals.css:68-76`; 390x844 inspection | Initial content remains opacity-zero during staged animation; the oversized headline consumes most of the first mobile viewport | Shorten/remove entrance delays on mobile and reduce the mobile headline one step | Small |
| M-02 | P2 Medium | Mobile exam | Live `/exam` at 390x844 | Layout does not overflow, but Next and Submit sit adjacent throughout the exam and the 60-button review grid creates a long scrolling decision surface | Reserve Submit for a final review state and make unanswered/flagged filters available | Medium |
| M-03 | P3 Low | iOS standalone | `app/globals.css:33-39`; `components/app-shell.tsx:71-91` | No safe-area padding is defined for notch/Home Indicator layouts when installed to the Home Screen | Add `viewport-fit=cover` and `env(safe-area-inset-*)` handling during PWA work | Small |

### Security / Privacy

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| SEC-01 | P1 High | Public personal data | `lib/course-data.ts:3225-3238`; `lib/course-data.ts:3320-3338` | The public curriculum discloses a clearance claim, credentials, military/C-UAS profile, terminal-leave month, and retirement date. The entire content object is also shipped in a common client chunk | Remove personalization from the public product immediately; keep private transition material in a separate private surface | Small |
| SEC-02 | P2 Medium | Dependencies | `package.json:15-37`; `npm audit` | Next.js 14.2.35 is inside multiple current advisory ranges; npm reports one high and one moderate chain | Plan a tested upgrade to a supported patched Next release; validate App Router and static output before deploying | Medium |
| SEC-03 | P3 Low | Response hardening | Live `/` headers | HSTS is present, but no CSP, `X-Content-Type-Options`, Referrer Policy, Permissions Policy, or explicit framing policy was observed | Add proportional static-site headers, prioritizing CSP/frame restrictions and nosniff | Small |
| SEC-04 | Observation | Rendering/privacy | Source scan | No `dangerouslySetInnerHTML`, user-controlled HTML, backend secrets, authentication, uploads, or PII collection found. Stored data is limited to study progress and activity labels | Preserve this minimal-data architecture; document it in a short privacy note | Small |

### Performance / Reliability

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| P-01 | P2 Medium | Client bundle | `components/app-shell.tsx:1-9`; `components/module-nav.tsx:7-23` | The client AppShell imports ModuleNav, which imports all 3,367 lines of course content. A 131 kB minified/about 46 kB gzip curriculum chunk loads on `/`, `/about`, `/exam`, and every route | Split lightweight module metadata from slide bodies; keep full course content route-scoped | Medium |
| P-02 | P3 Low | Lesson bundle | Production build | `/modules/[id]` has the largest first load at 157 kB; Framer Motion is used for a single slide transition | After the data split, reassess whether CSS transitions can replace the route-wide animation dependency | Small |
| P-03 | Observation | Images | `public/images/charts`; `components/slide-viewer.tsx:101-109` | Source charts total 6.1 MB, including two files over 1 MB, but Next Image provides sizing and lazy behavior | Optimize PNGs/WebP where legibility survives; verify chart labels at mobile zoom | Medium |

### SEO / PWA / iOS Readiness

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| SEO-01 | P2 Medium | Metadata/shareability | `app/layout.tsx:6-9` | Only a global title/description exists; no canonical, metadata base, Open Graph, Twitter card, or route-specific metadata | Add canonical metadata and descriptive per-route titles; create a real share image | Small |
| SEO-02 | P2 Medium | Indexing | Live `/robots.txt` and `/sitemap.xml` returned 404 | Crawlers lack explicit index/canonical route guidance | Add App Router `robots.ts` and `sitemap.ts` | Small |
| PWA-01 | P2 Medium | Install/offline | Manifest, favicon, Apple icon endpoints returned 404; no service worker found | Add to Home Screen has no branded icon/manifest and the app has no deliberate offline behavior | Add `manifest.ts`, icons, theme color, display mode, and an offline caching strategy | Medium |
| PWA-02 | P3 Low | Offline data | Current localStorage-only architecture | Progress survives offline after assets load, but a first offline launch or uncached lesson fails; no update/version UX exists | Cache the application shell and current curriculum; version stored progress and surface update failures | Medium |

### Frontend Design / UX

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| UX-01 | P1 High | Trust | Public Module 13 and verified FAA errors | The interface looks authoritative while containing personalized and incorrect regulatory statements, the most damaging trust mismatch possible for this product | Make content review/version/source ownership visible and remove private personalization | Medium |
| UX-02 | P2 Medium | Dashboard | `components/dashboard-summary.tsx:23-89` | Two Continue actions duplicate each other, but neither resumes the exact slide; weak areas show percentages without a remediation action | Use one dominant “Resume Module X, slide Y” card and link weak areas directly to relevant modules/cards | Medium |
| UX-03 | P2 Medium | Assessment feedback | Quiz/exam rendered inspection; `app/exam/results/page.tsx:33-80` | Quiz feedback is visually calm and clear, but assessment state is gameable; exam results stop at topic bars and do not teach from mistakes | Preserve the visual treatment while adding first-attempt scoring and question-by-question review | Medium |
| UX-04 | P2 Medium | Study plans | `app/study-plan/page.tsx:88-188` | The plan is readable but static, card-heavy, and has no completion feedback; its only direct module actions are broken | After repairing links, show module completion and one clear next-day action using existing progress data | Medium |
| UX-05 | P3 Low | Information architecture | `components/app-shell.tsx:12-20`; live `/about` and `/resources` | Resources and About exist but are absent from primary navigation; the mobile drawer instead exposes all 13 modules at once | Add lightweight secondary links and consider collapsible course phases in the drawer | Small |
| UX-06 | Observation | Visual design | Desktop/mobile inspection | Strong dark aviation palette, consistent card system, readable answer blocks, clear primary CTAs, and restrained icon use. It feels purpose-built rather than generic SaaS | Retain the visual system; focus redesign effort on study state, truthfulness, and assessment clarity | — |

### Tooling / Maintainability

| ID | Severity | Area | Evidence | Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|
| T-01 | P1 High | Test coverage | `package.json`; no test/config files found | Critical timer, scoring, storage, content, and route regressions can ship with a green build | Add Vitest/React Testing Library plus a small Playwright suite using the already-installed package | Medium |
| T-02 | P2 Medium | Content governance | Three large independent data files plus duplicated cram/research facts | Regulatory values drift across lessons, questions, cards, cram sheet, and research notes | Centralize rule facts and add schema/content-integrity tests with source URL and reviewed date | Medium |
| T-03 | P3 Low | Component typing | `components/ui/card.tsx:22-25` | `CardTitle` declares an `HTMLParagraphElement` ref while rendering an H3 | Correct the ref type or make the heading element configurable | Small |
| T-04 | Observation | Vercel tooling | `vercel --version` returned 50.43.0 | Local CLI is behind 55.0.0 | Upgrade separately with `npm i -g vercel@latest` or `pnpm add -g vercel@latest`; no deployment is needed for the upgrade itself | Small |

## Prioritized Remediation Plan

### 1. Immediate fixes before promotion

1. **Remove public personalization**
   - Likely file: `lib/course-data.ts`.
   - Outcome: no clearance, retirement, or private career details in the public bundle.
   - Smallest approach: replace Module 13's personalized rows/callouts with audience-neutral career guidance.

2. **Correct verified regulatory errors**
   - Files: `app/cram-sheet/page.tsx`, `lib/course-data.ts`, `lib/questions.ts`, `lib/flashcards.ts`, `research/regulations.md`.
   - Outcome: internally consistent, source-backed rules.
   - Smallest approach: correct the specific findings above and attach direct FAA/eCFR links plus a reviewed date.

3. **Repair broken routes**
   - Files: `app/study-plan/page.tsx`, `app/flashcards/page.tsx`, `components/flashcard-deck.tsx`.
   - Outcome: every study and activity link resolves.
   - Smallest approach: numeric module routes and an explicit global-deck activity URL.

4. **Fix assessment correctness**
   - Files: `components/practice-exam.tsx`, `components/quiz-engine.tsx`, `lib/questions.ts`.
   - Outcome: accurate timeout score, valid first-attempt scoring, realistic answer distributions.
   - Smallest approach: deterministic exam state, Fisher-Yates answer shuffling, first-answer lock, ACS-stratified draw.

5. **Persist and review exams**
   - Files: `lib/progress-storage.ts`, `lib/types.ts`, `components/practice-exam.tsx`, `app/exam/results/page.tsx`.
   - Outcome: refresh-safe two-hour exams with useful post-test review.
   - Smallest approach: save IDs/answers/flags/deadline and render review from that immutable attempt.

### 2. High-value hardening

1. Add route, data-integrity, timer, scoring, storage migration, and duplicate-card tests.
2. Upgrade Next.js through a tested compatibility branch.
3. Canonicalize flashcard state by card ID.
4. Add storage validation, write-error handling, and reset confirmation.
5. Split compact module navigation metadata from full lesson bodies.
6. Fix answer semantics, progress-bar values, touch targets, keyboard interception, and reduced motion.

### 3. UX/design improvements

1. Replace duplicate dashboard CTAs with an exact-slide resume card.
2. Turn weak-area percentages into direct study actions.
3. Move exam Submit into a final review step with unanswered/flagged counts.
4. Add first-attempt correctness language and explicit study mode if answer changing is desired.
5. Show module/day completion in study plans.
6. Reduce the mobile hero entrance delay and headline size without changing the design system.
7. Add secondary navigation for Resources and About.

### 4. Nice-to-have iOS/PWA/App Store preparation

1. Add manifest, icons, theme/background colors, standalone display, and safe-area styles.
2. Add offline shell/curriculum caching and an offline/update state.
3. Version and test local progress migrations.
4. Verify on actual iPhone Safari, standalone mode, rotation, zoom, keyboard, and VoiceOver.
5. Only after web/PWA stabilization, create a Capacitor proof of concept.

## iOS Path Recommendation

| Path | Fit for this project | Prerequisites | Complexity | Assessment |
|---|---|---|---|---|
| PWA / Add to Home Screen | Best immediate fit | Manifest, icons, service worker/offline strategy, safe areas, storage versioning, real iPhone QA | Low-Medium | Recommended first. The app is static, content-heavy, and already responsive. |
| Capacitor wrapper | Good later if App Store presence is required | Clean static export, bundled/offline assets, navigation/deep-link handling, status bar/safe areas, storage migration, App Store privacy/metadata | Medium | Recommended second step after the PWA and assessment/content fixes. |
| React Native / Expo rebuild | Poor current tradeoff | Full UI/state/content-porting plan, native navigation, new accessibility/performance QA, separate web strategy | High | Not recommended unless native-only capabilities become central. |

Best next step: **PWA first, then Capacitor if App Store distribution remains a goal.** A React Native rewrite would duplicate a working web architecture without solving the product's current risks: accuracy, assessment validity, persistence, and content governance.

## Final Hand-Off

### Fix now

1. Remove clearance/retirement/personal career content from public Module 13.
2. Correct Class G weather-minimum guidance.
3. Correct Part 107 registration guidance.
4. Correct the alcohol/BAC rule everywhere.
5. Replace outdated ACS weights and misleading reference-material guidance.
6. Fix all study-plan and global-flashcard activity routes.
7. Fix timed-exam stale scoring and persist in-progress exams.
8. Stratify exams, shuffle answer positions, and lock graded quiz answers.
9. Add complete exam review and incomplete-submit confirmation.
10. Add automated tests before upgrading Next.js and redeploying.

### Backlog

- Canonical flashcard state and storage schema migrations.
- Exact-slide resume.
- Accessibility semantics, target sizes, reduced motion, and heading cleanup.
- Bundle/data split.
- Dashboard and study-plan feedback improvements.
- Metadata, sitemap, robots, icons, manifest, offline behavior, and safe areas.
- Security headers.
- Actual iPhone Safari/VoiceOver verification.
- Vercel CLI upgrade.

### Owner decisions needed

- Is this a neutral public product or a private personalized transition tool? The current code attempts both and must be separated.
- Should module quizzes be graded first-attempt assessments, forgiving study mode, or offer both explicitly?
- Should practice exams reproduce the FAA format closely, including ACS weighting and three-option style, or remain broader study drills?
- Is the near-term distribution goal installable web/PWA or App Store presence?

## Evidence Notes

- Live visual evidence was captured during the audit for the desktop landing page, mobile landing/menu, lesson, quiz feedback/results, flashcards, study plan, active exam, and exam results.
- The screenshot files were temporary audit artifacts outside the repository and are not required to understand or act on this report.
- No physical iPhone Safari or VoiceOver run was performed. Mobile claims are limited to a 390x844 in-app Chromium viewport plus source inspection.
- No files were modified during the original audit. This Markdown document was added later at the project owner's explicit request as a Hermes handoff artifact.
