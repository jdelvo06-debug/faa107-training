# Supabase Auth configuration

The application uses Supabase Auth with email/password and Google OAuth. Apple Sign In and progress synchronization are not part of this implementation.

## Application environment variables

Set these two variables in `.env.local` for local development and in Vercel for Production, Preview, and Development as needed:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qbeioesktbpvdlgzrgsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
```

Do not add a service-role key. `.env.local` is ignored by Git.

## Supabase Auth URL Configuration

In Supabase Dashboard → Authentication → URL Configuration, add:

- Site URL: `https://faa107training.org`
- Redirect URLs:
  - `https://faa107training.org/auth/callback`
  - `https://faa107-training.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

If Vercel preview deployments must complete OAuth, also add the documented Vercel preview wildcard for this account, narrowed to the account slug:

```text
https://*-<vercel-team-or-account-slug>.vercel.app/auth/callback
```

Replace the placeholder with the actual Vercel team/account slug. Supabase recommends exact production redirect paths and permits wildcards for previews.

Both deployed origins returned HTTP 200 during the implementation check on 2026-07-12. The custom domain matches the application's current canonical metadata, so it is the Site URL; the Vercel hostname remains an allowed deployed callback.

## Google provider check

Google OAuth is already enabled in Supabase. Do not change or copy its client secret. Confirm only that Google Cloud's authorized redirect URI remains:

```text
https://qbeioesktbpvdlgzrgsm.supabase.co/auth/v1/callback
```

The app-facing redirect is `/auth/callback`; the Google-facing redirect above is Supabase's provider callback. They are intentionally different.

## Email confirmation behavior

Signup passes the application callback URL as `emailRedirectTo`. If Confirm Email is enabled, the confirmation email must be allowed to return to `/auth/callback`. If email templates have been customized, ensure they use the redirect target supplied by the signup request rather than a stale localhost Site URL.
