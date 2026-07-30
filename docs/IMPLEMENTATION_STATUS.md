# MoneyLau Implementation Status

## Completed: Phase 8 - Complete Finance Workflows

- Expanded accounts into a complete create, edit, reorder, archive, restore, and balance-tracking workflow with institution, account type, color, icon, last-four, and include-in-total controls.
- Expanded categories into complete income and expense management with parent categories, custom styling, ordering, archiving, and restoration.
- Completed the transaction ledger with editing, permanent deletion, server-side filters, date ranges, pagination, references, tags, and archived-record compatibility.
- Added protected tags and transaction-tag relationships with row-level security and explicit authenticated-role grants.
- Reworked onboarding to collect profile defaults, create a first account, review default categories, and optionally record a first transaction.
- Expanded settings with avatar, profile defaults, dashboard period, archived-record visibility, theme, and account-data controls.
- Added shared comma-separated money formatting and focused unit coverage so monetary values consistently render like `1,234.56 PHP`.
- Added shadcn table, dialog, select, pagination, tabs, avatar, checkbox, chart, and Sonner primitives for the completed workflows.

## Completed: Phase 7 - Production Readiness

- Adopted the shadcn Sidebar component for collapsible desktop navigation and its responsive mobile sheet, while retaining the compact mobile navigation bar.
- Added a GitHub Actions verification workflow for feature branches, pull requests, and `main`.
- Added Vercel Next.js project configuration and a complete deployment guide covering environment values, Supabase configuration, Google OAuth, preview deployments, and production checks.
- Added public Privacy and Terms pages linked from the sign-in screen for the Google OAuth consent configuration.
- Expanded ledger test coverage for multiple currencies, date ranges, pending/cancelled activity, and category spending totals.
- Completed the README with local setup, validation, deployment, and security guidance.

## Completed: Phase 6 - Settings, Onboarding, and UI Polish

- Added a protected onboarding route for new Google-authenticated users and redirected new OAuth callbacks there.
- Added profile preferences for display name, currency, timezone, date format, week start, dashboard period, and persisted theme selection.
- Added a deletion-request workflow that requires an explicit `DELETE` confirmation and records the request without placing privileged Supabase credentials in the app.
- Added Phase 6 migrations for profile preferences and anonymous-access revocation.
- Reworked account, category, transaction, navigation, empty-state, badge, and form surfaces using the shadcn Radix Nova components.
- Added interaction-aware category and transaction forms so incompatible parent categories, currencies, and transaction categories are not offered.
- Added focused profile preference validation tests.

## Previously Completed

- Phase 5: dashboard income, expense, cash-flow, account-balance summaries, Recharts visualization, reports, and authenticated CSV export.
- Phase 4: validated income, expense, and transfer transaction ledger with RLS-protected account balances.
- Phase 3: accounts, categories, archiving, default categories, and category ownership validation.
- Phase 2: Supabase SSR session handling, Google OAuth flow scaffolding, profiles, and row-level security.
- Phase 1: Next.js foundation, dark-first shadcn theme setup, environment validation, and Supabase client scaffolding.

## Migrations

- `20260730004903_phase_8_complete_finance_workflows.sql`
- Phase 7: none.
- `20260729080000_phase_6_preferences_deletion.sql`
- `20260729080500_phase_6_revoke_anon_access.sql`

## Remaining Issues

- Account deletion is intentionally a recorded deletion request. Completing the permanent Auth-user removal requires a secure administrative process outside the browser app; no service-role secret is shipped to the client.
- Supabase reports informational authenticated GraphQL discoverability notices because authenticated client queries are intentionally enabled and protected by row-level security.
- New indexes are reported as unused until the production dataset and query history grow; they support foreign keys and expected ledger filtering.

## Recommended Next Phase

Phase 9: build the Monefy-inspired expense-distribution dashboard and complete the reporting experience with period filters, category portions, cash-flow trends, and comma-separated numeric presentation.
