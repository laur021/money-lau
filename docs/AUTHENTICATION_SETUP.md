# Authentication Setup

## Supabase

1. Create a Supabase project and run the migration in `supabase/migrations`.
2. In Authentication > URL Configuration, set the Site URL to `NEXT_PUBLIC_APP_URL` and add `http://localhost:3000/auth/callback` plus each deployed `/auth/callback` URL to Redirect URLs.
3. In API settings, put the project URL and public anon key in `.env.local`. Never use a service-role key in this application.
4. If the project requires Data API access, expose `profiles` and `categories` in the Supabase dashboard; new Supabase projects no longer expose public tables automatically.

## Google OAuth

1. Create a Web OAuth client in Google Cloud.
2. Add the app URLs as authorized JavaScript origins.
3. Copy the Supabase-generated Google callback URL from Authentication > Providers > Google into Google Cloud's authorized redirect URIs.
4. Enable Google in Supabase and store the Google client secret only in the Supabase dashboard.

The app uses PKCE and exchanges the authorization code in `/auth/callback`. Sessions are refreshed by `proxy.ts`, and protected routes verify claims with `getClaims()`.
