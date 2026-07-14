# Curriculum Bundle Split Measurement

Date: 2026-07-14
Branch: `codex/faa107-training-platform`
Framework: Next.js 15.5.20

Both measurements came from fresh, successful local `npm run build` runs. Each build generated all 63 static pages. No deployment or live-site measurement is represented here.

## Route build output

Next.js reports a route's emitted size and First Load JS, but its App Router table did not expose the full root-layout curriculum chunk in every lightweight route's number. The artifact measurements below therefore remain the stronger proof for the shared-data boundary.

| Route | Before size | After size | Before First Load JS | After First Load JS | First Load delta |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 2.01 kB | 2.01 kB | 113 kB | 113 kB | 0 kB |
| `/about` | 1.61 kB | 1.61 kB | 104 kB | 104 kB | 0 kB |
| `/dashboard` | 3.64 kB | 3.64 kB | 258 kB | 219 kB | -39 kB |
| `/exam` | 17.4 kB | 17.4 kB | 139 kB | 138 kB | -1 kB |
| `/resources` | 1.62 kB | 1.62 kB | 107 kB | 107 kB | 0 kB |
| `/modules` | 5.92 kB | 5.91 kB | 171 kB | 132 kB | -39 kB |
| `/modules/1` | 50.2 kB | 50.2 kB | 172 kB | 172 kB | 0 kB |
| `/modules/1/quiz` | 8.37 kB | 8.37 kB | 125 kB | 125 kB | 0 kB |
| `/modules/1/flashcards` | 185 B | 185 B | 124 kB | 124 kB | 0 kB |

The unchanged lesson-route figure is expected: `/modules/[id]` still receives the selected module's full slide bodies. Quiz and flashcard routes retain their own question/card data without importing lesson bodies.

## Shared curriculum artifact

Before the split, the active shared path was `app/layout.tsx` -> `AuthProvider` -> `progress-rpc.ts` / `progress-sync.ts` -> `progress-merge.ts` -> `course-data.ts`. It attached `.next/static/chunks/7738-9b71e7c23448e9d1.js` to every sampled route through the root layout. That chunk contained all 118 slide IDs plus distinctive lesson prose from early, middle, and late modules. After the split, `.next/static/chunks/3941-37c627367936a76a.js` contains the ordered identity metadata needed by progress logic, including all 118 slide IDs, but none of the sampled lesson phrases.

| Shared curriculum artifact | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Raw bytes | 130,420 | 16,565 | 113,855 (87.3%) |
| gzip level 9 | 44,237 | 6,070 | 38,167 (86.3%) |
| Brotli quality 11 | 36,518 | 4,891 | 31,627 (86.6%) |

As a second diagnostic, summing the unique uncompressed script files referenced by prerendered HTML produced these results. These are raw build-artifact totals, not network transfer-size claims.

| Route | Before raw script bytes | After raw script bytes | Reduction |
| --- | ---: | ---: | ---: |
| `/` | 1,075,029 | 959,142 | 115,887 (10.8%) |
| `/about` | 1,055,072 | 939,185 | 115,887 (11.0%) |
| `/dashboard` | 1,065,323 | 949,413 | 115,910 (10.9%) |
| `/exam` | 1,107,578 | 991,691 | 115,887 (10.5%) |

The lesson phrase `Your Part 107 Flight Plan` is absent from all after-build static client chunks and from the sampled lightweight route HTML. It remains in `/modules/1` HTML/RSC, proving full content is still available on the lesson route.

## Data boundary

- `lib/course-metadata.ts` now holds module ID, numeric order, title, description, estimated minutes, topic area, and ordered slide IDs.
- Landing, dashboard, module list/navigation, progress selectors, progress normalization/merge, quiz routes, and flashcard routes use that lightweight module.
- `lib/course-data.ts` retains the complete lesson bodies and is reachable only from `app/modules/[id]/page.tsx` in the application import graph.
- Static generation and direct numeric module, quiz, and flashcard routes remain unchanged.

## Remaining bottlenecks

- The global progress normalization path still imports question and flashcard banks to validate stable IDs, counts, and ordering. Splitting those identity records would be a separate measured change, not part of this lesson-body boundary.
- The lesson route intentionally retains its 50.2 kB route size and Framer Motion dependency.
- Chart images were not changed. This measurement did not establish them as a shared-route JavaScript bottleneck.

The evidence supports a specific claim: lightweight routes no longer receive full lesson-slide bodies through the shared client graph. It does not establish a universal page-load or runtime-speed improvement.
