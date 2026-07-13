# Supabase Auth and account-progress configuration

## Deployed status

The production application at `https://faa107training.org` uses Supabase project `qbeioesktbpvdlgzrgsm` for:

- email/password authentication;
- Google OAuth;
- signed-in learner progress synchronization and account-wide reset.

Apple Sign In is deferred. Anonymous learners remain local-only and do not require a Supabase progress record. The account-progress migration `20260712000000_account_progress_sync.sql` is applied to the shared project.

## Application environment variables

Set these public variables in `.env.local` for local development and in the appropriate Vercel environments:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qbeioesktbpvdlgzrgsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase publishable/anon key>
```

Do not add a service-role key to browser or application configuration. Do not commit `.env.local`, provider secrets, test-account credentials, or copied dashboard values.

## Supabase Auth URL Configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://faa107training.org`
- Allowed redirect URLs:
  - `https://faa107training.org/auth/callback`
  - `https://faa107-training.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

If Vercel preview deployments must complete OAuth, add the documented preview wildcard narrowed to the actual Vercel account/team slug:

```text
https://*-<vercel-team-or-account-slug>.vercel.app/auth/callback
```

Use exact production paths and replace the placeholder before saving. The custom domain is the canonical production origin; the Vercel hostname remains an allowed deployed callback.

## Provider state

### Google

Google OAuth is enabled. Do not change or copy its client secret during routine verification. Google Cloud's authorized redirect URI should remain Supabase's provider callback:

```text
https://qbeioesktbpvdlgzrgsm.supabase.co/auth/v1/callback
```

The app-facing `/auth/callback` route and Google-facing Supabase callback are intentionally different.

### Email/password

Signup supplies the application callback as `emailRedirectTo`. When Confirm Email is enabled, confirmation mail must be allowed to return to `/auth/callback`. Customized email templates must honor the redirect supplied by the signup request rather than a stale localhost URL.

### Apple

Apple Sign In is not configured or promised by the current release. Treat it as a separately approved future provider, not an incomplete production requirement.

## Progress synchronization boundary

- Migration: `supabase/migrations/20260712000000_account_progress_sync.sql`
- Signed-in data is owner-scoped with RLS and application RPCs; direct cross-user access is not part of the client contract.
- Anonymous progress remains local-only.
- Reset is account-wide for the signed-in user.
- Realtime assists open-tab refresh but is not the correctness mechanism; revision/reset-generation RPC behavior and refetches are authoritative.
- The final live Realtime propagation retest after `411a2b7` was inconclusive because the listener held no pre-reset record. It remains a soak observation, not a passed production check.

No keys or secrets belong in this document.
