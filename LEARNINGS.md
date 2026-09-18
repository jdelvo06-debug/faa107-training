# Learnings

## Database health and shared-project lockdown (2026-09-18)

- Supabase project `qbeioesktbpvdlgzrgsm` is shared with retired DroneWire. FAA uses Auth, `faa107_user_progress`, and its progress RPCs. Do not revoke privileges schema-wide.
- RLS being enabled is not enough: retired DroneWire policies permitted anonymous updates. The lockdown removes client policies and table/column/owned-sequence grants while retaining records and administrator/service access.
- Integration tests previously selected the first running Supabase container. They now require `FAA107_TEST_CONTAINER` and `FAA107_TEST_DATABASE` with the `faa107_test_` prefix to avoid altering another project's data.
- A fresh checkout needs `npx playwright install chromium` before browser tests.
- Vercel production environment downloads can contain empty values for sensitive variables. For local builds, verify public Supabase credentials point to the correct project before providing them. Do not overwrite production values with downloaded blanks.
- The Vercel connector's get-project schema failed validation (`idOrName` expected despite a documented `projectId` argument). Use the authenticated Vercel CLI to inspect the existing project.
