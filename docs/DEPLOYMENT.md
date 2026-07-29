# MoneyLau Deployment Guide

## 1. Confirm the production Supabase project

Use the same Supabase project that contains the MoneyLau migrations, or apply every migration in `supabase/migrations` in filename order to a new project. In the Supabase dashboard, verify that Row Level Security is enabled for `profiles`, `accounts`, `categories`, and `transactions`.

In **Authentication > URL Configuration** set:

- **Site URL:** `https://YOUR-VERCEL-DOMAIN`
- **Redirect URLs:** `https://YOUR-VERCEL-DOMAIN/auth/callback`
- Keep `http://localhost:3000/auth/callback` for local development.

For a Vercel preview that needs sign-in, add that exact preview URL plus `/auth/callback`. Supabase only honors `redirectTo` values that appear in this allow-list.

## 2. Configure Google OAuth

In Google Cloud Console, open **Google Auth Platform > Clients** and select the MoneyLau web client.

- Add `https://YOUR-VERCEL-DOMAIN` to **Authorized JavaScript origins**.
- Keep `http://localhost:3000` for local development.
- Add the Supabase callback, exactly as shown in Supabase **Authentication > Sign In / Providers > Google**, to **Authorized redirect URIs**. It has this shape: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.

In Supabase **Authentication > Sign In / Providers > Google**, enable Google and paste the Google OAuth client ID and client secret. Do not put the Google secret in `.env.local`, GitHub, or Vercel.

## 3. Create the Vercel project

1. In Vercel, choose **Add New > Project** and import `laur021/money-lau`.
2. Vercel detects this as a Next.js project. Leave the default build command (`next build`) and install command (`npm install`) in place.
3. In **Settings > Environment Variables**, add these values to **Production**:

```env
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

The Supabase URL and publishable/anon key are designed for browser use. Do not add `SUPABASE_SERVICE_ROLE_KEY`, a database password, or the Google OAuth client secret.

4. Deploy. Any change to an environment value needs a new deployment before the value is available to the application.

## 4. Preview and production flow

1. Push a feature branch. GitHub Actions verifies linting, types, tests, and the production build.
2. Once the Vercel Git integration is connected, Vercel creates a preview deployment for that branch or pull request.
3. Review the preview, then merge the approved branch into `main`.
4. Vercel deploys `main` as production.

## Production checklist

- [ ] The GitHub Actions `Verify` workflow is green.
- [ ] Vercel production environment variables are present and no secrets are committed.
- [ ] Supabase Site URL and redirect allow-list use the final Vercel domain.
- [ ] Google has the final Vercel domain as an authorized origin and the Supabase `/auth/v1/callback` URL as an authorized redirect URI.
- [ ] Google is enabled in Supabase with its client ID and secret.
- [ ] Sign in, sign out, onboarding, account creation, transaction creation, report CSV export, dark/light/system theme selection, and account-deletion request have been checked in production.
- [ ] The Privacy and Terms pages are reachable at `/privacy` and `/terms`.

## Troubleshooting

- A sign-in redirect to localhost means `NEXT_PUBLIC_APP_URL` or Supabase Redirect URLs still point to a local address.
- A Google `redirect_uri_mismatch` error means the Google OAuth client is missing the Supabase `/auth/v1/callback` URI or it differs by one character.
- If Vercel reports missing environment variables, add them for the correct environment and redeploy.

## Why a deployment is not created by this repository

Vercel deployment ownership and Google/Supabase provider credentials are intentionally configured in their dashboards. The repository supplies the Vercel project configuration, CI workflow, and complete setup steps, but it does not contain credentials or an unattended deployment token.
