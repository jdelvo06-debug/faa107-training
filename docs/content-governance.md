# FAA 107 Content Governance

## Purpose and boundary

This project is an educational study resource. It is not the FAA, is not endorsed by the FAA, and does not provide legal advice. Learners and operators remain responsible for checking the current rule text, FAA authorizations, airspace status, notices, and operating conditions that apply to a real flight.

The governance system is intentionally narrow. It protects the instructional facts most likely to create a safety, regulatory, or exam-integrity problem if they become stale. It does not make every sentence in the curriculum a legal interpretation.

The machine-readable source of truth is [`lib/regulatory-sources.ts`](../lib/regulatory-sources.ts). It contains:

- stable record and source IDs;
- one of the required high-risk topics;
- canonical facts used by learner surfaces;
- official FAA or eCFR source URLs and edition/effective-date notes;
- the review owner and independent reviewer roles;
- the last source-comparison date;
- cadence and event-driven review triggers; and
- the files that consume or restate each fact.

## Authoritative-source hierarchy

Use sources in this order:

1. **Current rule text:** the current eCFR Title 14 text for the section being taught. If an amendment, transition date, or legal effective date is disputed, confirm it against the published CFR or Federal Register material linked from the official rule history.
2. **Controlling FAA publications:** the current FAA Airman Certification Standards, Aeronautical Chart User's Guide, official certification pages, and official program guidance for the fact at issue.
3. **The local registry:** the reviewed, normalized fact and source metadata in `lib/regulatory-sources.ts`.
4. **Learner-facing copies:** course slides, questions, flashcards, cram-sheet data, research notes, and resource links.

Lower levels must agree with higher levels. An old project audit is historical evidence only. Blog posts, search snippets, third-party study guides, and AI output are never authority for a regulatory change.

The eCFR is a continuously updated presentation of the CFR. The registry therefore records the eCFR “current through” date used during review. FAA pages and documents record the published edition, effective date, or page-update date when one is available.

## Ownership and review

Each registry record assigns two roles:

- **Fact owner — FAA 107 course content maintainer:** monitors triggers, verifies the official sources, updates the canonical fact and affected consumers, writes the fail-first integrity test, and records the review metadata.
- **Reviewer — independent FAA regulatory content reviewer:** did not author the change and verifies the cited official source, effective date, learner wording, and affected-surface inventory before release.

`lastReviewed` means the owner compared the record with the listed official sources on that date. It is not a claim of FAA approval or legal review. The identity of the person performing the independent release review belongs in the commit, pull-request, or release evidence; the registry stores the durable role rather than a name that can become stale.

## Initial governed records

| Stable record ID | Topic | Last reviewed | Routine review | Event-driven trigger |
|---|---|---:|---|---|
| `part-107-operating-limitations` | Part 107 operating limits and small-UAS weight | 2026-07-14 | Quarterly and before curriculum release | Amendment to 14 CFR §§ 1.1, 107.9, 107.37, or 107.51, or new FAA limitation guidance |
| `part-107-registration` | Part 107 registration | 2026-07-14 | Quarterly and before curriculum release | Registration rule, DroneZone fee, term, eligibility, or category change |
| `part-107-alcohol-drug-restrictions` | Alcohol and drug restrictions | 2026-07-14 | Quarterly and before curriculum release | Amendment to 14 CFR §§ 107.27 or 91.17 |
| `part-107-recency-certificate-terminology` | Certificate status and aeronautical knowledge recency | 2026-07-14 | Quarterly and before curriculum release | § 107.65, FAA course-code, eligibility-path, or certificate-status change |
| `part-107-operations-over-people` | Operations-over-people categories | 2026-07-14 | Quarterly and before curriculum release | Part 107 Subpart D, declaration, category, Remote ID, or assembly guidance change |
| `part-107-airspace-weather-minimums` | Controlled airspace, chart symbols, visibility, and cloud clearance | 2026-07-14 | Quarterly, at each chart-guide edition, and before curriculum release | §§ 107.41/107.51 change, JO 7210.3 change, or new Chart User's Guide |
| `faa-uas-acs-weighting` | FAA UAS ACS edition and percentage ranges | 2026-07-14 | Quarterly and before exam-content release | New UAS ACS edition or test-format/range change |

The registry's `reviewTrigger` and `consumerSurfaces` fields are the detailed machine-readable version of this table.

## Handling a regulatory or source change

1. Open the official source itself and establish whether the change is current, future-effective, proposed, or only explanatory guidance.
2. If the effective status is unclear, do not change learner-facing content. Record the uncertainty and seek an independent regulatory review.
3. Identify the registry record and every listed consumer surface. Search for additional copies before editing.
4. Add or update a failing structured content-integrity test that demonstrates the old fact or wording.
5. Change the canonical fact first. Update only consumers that cannot import the canonical value directly.
6. Record the source edition/effective date and set `lastReviewed` to the actual comparison date. Do not advance the date for a link-only or style-only edit.
7. Run the focused integrity test, full test suite, lint, TypeScript check, production build, and `git diff --check`.
8. Obtain independent source-and-wording review before release. Keep local, committed, pushed, and deployed state separate in the handoff.

For a future-effective rule, retain the current fact until the effective date unless the product explicitly presents both states with dates. Never silently teach a proposal as current law. If an official page conflicts with current rule text, use the rule text for the legal requirement and describe the FAA page only as guidance; escalate material conflicts for review.

## Freshness checklist

At each routine review or trigger:

- confirm each registry URL still resolves to an approved `faa.gov` or `ecfr.gov` host;
- compare the eCFR current-through and amendment dates with the stored metadata;
- check the FAA ACS index for a newer UAS ACS edition;
- check the current Chart User's Guide edition and FAA Order JO 7210.3 Class E designation criteria;
- check FAA registration, certification/recency, and operations-over-people pages for revision dates or changed terminology;
- run `node --test tests/content-governance.test.cjs` to verify governed categories, metadata, consumer paths, and protected duplicated facts; and
- record any independent review and unresolved risk in the release evidence.

Broken links do not authorize substituting a third-party source. Locate the replacement official page, verify that it supports the same fact, update the source record, and rerun review.
