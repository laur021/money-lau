# MoneyLau Implementation Status

## Completed: Phase 2 - Authentication and Database Security

- Implemented Google OAuth initiation, PKCE callback exchange, sign-out, and clear user-facing authentication errors.
- Added cookie-based Supabase session refresh in `proxy.ts` and protected the application route group with verified JWT claims.
- Applied the initial Supabase migration to `Laurs Project`, provisioning profiles and default income/expense categories on first login.
- Added an explicit function-permission migration after security-advisor verification confirmed trigger helpers must not be callable by browser roles.
- Added authentication setup instructions and redirect-path tests.

## Architectural Decisions

- Protected pages use `getClaims()` rather than trusting a cookie-backed session object.
- Google secrets remain only in Google Cloud and Supabase dashboard configuration; the app uses only public Supabase connection values.
- Accounts and transaction tables are deferred to Phases 3 and 4. The initial migration includes categories solely because the new-user trigger provisions defaults.

## Changed Files

- Auth actions, callback route, session proxy, protected layout, login UI, and sign-out control.
- `supabase/migrations/20260728074331_phase_2_auth_profiles_categories.sql` and `supabase/migrations/20260728075633_phase_2_revoke_function_execution.sql`.
- `docs/AUTHENTICATION_SETUP.md`, auth redirect tests, and this status document.

## Database Migrations

- `20260728075558_phase_2_auth_profiles_categories`: profiles and categories, user provisioning/default categories, RLS policies, grants, indexes, and timestamp triggers.
- `20260728075655_phase_2_revoke_function_execution`: revokes browser-role execution of security-definer trigger helpers.

## Remaining Issues

- Configure the Supabase Google provider and Google Cloud client using the setup guide before live authentication can be exercised.
- Supabase's security advisor still notes GraphQL schema visibility for RLS-protected tables and unrelated existing `Activities`; no MoneyLau data is readable without matching RLS policies.
- Account/category management, transactions, reports, onboarding, and settings remain intentionally out of scope.

## Recommended Next Phase

Phase 3: implement account and category management, subcategories, archiving, ownership validation, and account/category tests.
