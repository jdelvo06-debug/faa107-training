# Database availability and retired DroneWire access

The production Vercel project `faa107-training` runs `/api/cron/database-health` daily at 12:00 UTC (Hobby scheduling can vary within the hour). It makes an uncached Data API read of `public.faa107_healthcheck`, using existing public credentials. This is best-effort activity on the free Supabase plan, not a no-pause guarantee.

The route requires `Authorization: Bearer <CRON_SECRET>`. Store the randomly generated secret as a sensitive production Vercel variable; never commit or include it in URLs/logs. The route bypasses session middleware, uses a five-second timeout per attempt, and retries a transient failure once. Success requires exactly the expected fixed marker. Logs contain outcome, UTC timestamp, elapsed milliseconds and attempt count; no user data or credentials. The route returns 401 for unauthorized requests and 503 for configuration/database/response failures. HTTP responses are never cached.

Migration `20260918002909_database_health_and_retired_dronewire_lockdown.sql` locks the explicit set of 22 retired DroneWire tables in the shared project. It preserves all records, FAA progress access, fitness tables and service/admin access. The health marker permits public SELECT only. Do not add permissive policies to clear advisor warnings.

Before rollout, capture grants, policies and row counts in a restricted file outside Git. Verify the exact target project and compare counts after migration. Apply the migration before deploying the endpoint. Production rollback should roll back the app only; do not automatically reopen retired tables. An intentional DroneWire reactivation needs a separate access review.

## Verification

Run Node tests with an explicitly isolated database:

```sh
FAA107_TEST_CONTAINER=<container> FAA107_TEST_DATABASE=faa107_test_<suffix> npm test
npm run lint
npx tsc --noEmit
npm run build
```

Initialize the test database with the existing account-progress migration and retired-table fixtures before testing the new migration. Run `supabase/tests/account_progress_sync.sql` and `supabase/tests/database_health_lockdown.sql` using psql with `ON_ERROR_STOP=1`. Use test identities, never real learner progress.

Verify the production endpoint manually using its secret, check unauthorized requests are rejected, then inspect Vercel's actual cron invocation/log record after the next scheduled run. A manual 200 response does not prove scheduled execution. No email service is configured; investigate failed or missing runs in Vercel logs and any Supabase pause warnings.
