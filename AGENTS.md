# AGENTS.md — FAA 107

Guidance for agents working in the FAA Part 107 training resource.

## Project Mapping

- Local repo path: `/Users/jeremydelvaux/projects/FAA 107`
- Canonical production URL: `https://faa107training.org`
- Hosting: Vercel.
- Purpose: FAA Part 107 training and study resource.

## Operating Rules

- Keep aviation and regulatory content accurate. Verify current FAA/eCFR sources and rule references before instructional changes; never present an assumption as regulatory fact.
- Before editing, verify the repo path, remote, branch, and status. Preserve all existing tracked and untracked work; do not reset, clean, stash, overwrite, stage, or include unrelated changes without Jeremy's approval.
- Stay within the requested scope. If ambiguity affects safety, regulatory accuracy, credentials, deployment, or an irreversible action, stop and ask Jeremy. Otherwise use the smallest reversible assumption, document it, and do not broaden the task.
- Use validation appropriate to the task and allowed scope; report any checks intentionally skipped.

## Approval Boundaries

- Without Jeremy's explicit approval, do not commit, push, open or update a pull request, merge, deploy, release, publish, or mutate external systems.
- This prohibition includes auth, credentials, environment variables, provider settings, hosting, DNS, Supabase, Vercel, GitHub, and task boards.

## Agent OS Tasking Boundary

- Cortana Command Center (CCC) Kanban is the source of truth for active tasking; GitHub is for code workflow only. Bypass Hermes Kanban and other external boards unless Jeremy explicitly requests them.
- Jeremy's direct instruction is sufficient tasking. Use an existing CCC card when one exists, but do not invent task records.
- Codex reports exact evidence—files changed, diff summary, commands and results, skipped checks, blockers, and remaining risks—to Cortana/Hermes. Cortana/Hermes verifies the work and updates CCC; Codex must not create, move, or edit CCC cards unless Jeremy expressly authorizes it.
