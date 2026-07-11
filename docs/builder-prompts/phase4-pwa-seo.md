# Phase 4: PWA, SEO, and iOS Standable Preparation

## Context

- Repository: /Users/jeremydelvaux/projects/FAA 107
- Branch: codex/faa107-training-platform
- Phases 0-3B are committed and pushed.
- Custom domain: faa107training.org (live, TLS issued, verified on Vercel)
- Audit: docs/audits/2026-07-09-full-project-audit.md (SEO-01, SEO-02, PWA-01, PWA-02, M-03)

## Mission

Add PWA manifest, SEO infrastructure, and iOS standalone safe-area styles. Do NOT add a service worker or offline caching in this pass. Do NOT add new npm packages.

Do not commit, push, deploy, reset, stash, or clean.

## Preflight

Read before editing:
- AGENTS.md
- docs/audits/2026-07-09-full-project-audit.md (sections: SEO/PWA/iOS Readiness, Mobile/Responsive M-03)
- app/layout.tsx
- app/globals.css
- app/page.tsx
- components/app-shell.tsx
- next.config.mjs (or next.config.js - check which exists)
- package.json

Run:
- git status --short --branch
- git remote -v

---

## Scope 1 - PWA Manifest (PWA-01)

Create `app/manifest.ts` using Next.js App Router metadata API.

Required manifest fields:
- name: "FAA Part 107 Training Platform"
- short_name: "Part 107"
- description: "Free FAA Part 107 remote pilot certification study platform"
- start_url: "/"
- display: "standalone"
- background_color: "#061525" (match the app background)
- theme_color: "#f59e0b" (match the primary amber color)
- icons: Generate or create icon files. Required sizes: 192x192, 512x512, and apple-touch-icon 180x180. If you cannot generate raster icons, create a clean SVG icon and reference it with purpose "any" and "maskable". Place icons in /public/icons/.

Also:
- Add a favicon. Create an SVG favicon at /public/favicon.svg if no .ico exists.
- Add apple-touch-icon link in layout metadata.
- Add theme-color meta tag in layout metadata (value: #f59e0b).
- Add manifest link in layout metadata.

---

## Scope 2 - SEO Infrastructure (SEO-01, SEO-02)

### robots.txt

Create `app/robots.ts` using Next.js App Router:
- allow all routes
- sitemap URL: https://faa107training.org/sitemap.xml

### sitemap.xml

Create `app/sitemap.ts` using Next.js App Router.

Include these routes:
- All static: /, /modules, /flashcards, /exam, /cram-sheet, /study-plan, /dashboard, /resources, /about
- All 13 module routes: /modules/1 through /modules/13
- All 13 module quiz routes: /modules/1/quiz through /modules/13/quiz
- All 13 module flashcard routes: /modules/1/flashcards through /modules/13/flashcards
- /exam/results

Set lastModified to current date or a fixed recent date.
Set changeFrequency to "monthly" for content routes, "weekly" for dashboard/exam.
Set priority: 1.0 for /, 0.9 for /modules, 0.8 for individual modules, 0.7 for quiz/flashcards, 0.6 for others.

### Per-route metadata

Update `app/layout.tsx` metadata:
- metadataBase: "https://faa107training.org"
- Keep existing title and description.
- Add openGraph: type "website", url "https://faa107training.org", siteName "FAA Part 107 Training Platform", title, description.
- Add twitter: card "summary_large_image", title, description.
- Add icons: reference favicon and apple-touch-icon.
- Add manifest: "/manifest".

Add per-route metadata exports to these key pages only:
- app/page.tsx (landing)
- app/modules/page.tsx (module listing)
- app/exam/page.tsx (practice exam)
- app/cram-sheet/page.tsx (cram sheet)
- app/study-plan/page.tsx (study plan)
- app/about/page.tsx (about)

Do NOT add metadata to every single route. Do NOT add an OG share image in this pass.

---

## Scope 3 - iOS Safe-Area Styles (M-03)

1. Add viewport-fit=cover to the viewport export in layout.tsx:
   ```typescript
   export const viewport: Viewport = {
     viewportFit: "cover",
   };
   ```

2. Add safe-area CSS to app/globals.css:
   - Add padding to the body or app shell using env(safe-area-inset-*) for notch and Home Indicator.
   - Apply to the mobile header (top safe area) and the fixed desktop sidebar (left safe area).
   - On desktop with no notch, env() returns 0 so there is no visual effect.
   - Do NOT change any existing layout structure. Only add safe-area CSS.
   - Verify the desktop sidebar still aligns correctly.

---

## Out of Scope

Do NOT:
- Add a service worker, offline caching, or workbox.
- Add an OG share image.
- Do bundle splitting or course-data refactoring.
- Change FAA instructional content.
- Implement Phase 3A P2 backlog items.
- Commit, push, deploy, reset, stash, or clean.

---

## Verification

Run fresh:
1. npm test
2. npm run lint
3. npm run build
4. git diff --check

Browser smoke:
- Verify /manifest.webmanifest returns valid JSON.
- Verify /robots.txt returns valid text.
- Verify /sitemap.xml returns valid XML with all expected routes.
- Verify html has viewport-fit=cover.
- Verify theme-color meta tag is present.
- Verify apple-touch-icon link is present.
- Verify no horizontal overflow at 390px.

---

## SITREP

Return:
1. Status
2. Exact files changed/created
3. Manifest fields and icon strategy
4. SEO: robots, sitemap, metadata details
5. Safe-area CSS approach
6. Tests added (if any)
7. Verification matrix
8. Browser smoke results
9. Known limits
10. Git status and confirmation nothing was committed, pushed, or deployed