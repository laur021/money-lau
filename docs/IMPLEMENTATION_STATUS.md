# MoneyLau Implementation Status

## Application Status: Complete

MoneyLau now includes the planned personal-finance workflows, authenticated data model, salary calculator with optional Philippine contribution estimates, reporting experience, production configuration, and final runtime states. PWA packaging is intentionally not included.

## Completed: Phase 12 - Philippine Government Contributions

- Added optional SSS, PhilHealth, and Pag-IBIG private-sector employee presets to salary profiles and pay runs.
- Added effective-dated local rule definitions using the January 2025 SSS and PhilHealth schedules and the February 2024 Pag-IBIG schedule, with official source links.
- Added editable monthly basic salary and monthly compensation bases with frequency-aware prefills and full, half, or quarter allocation defaults.
- Added per-run custom deductions, including zero for extra paydays, plus reset-to-computed behavior.
- Preserved rule version, prescribed monthly amount, allocation fraction, salary bases, override, and final deduction in each salary-run snapshot.
- Enforced PHP-only presets, duplicate prevention, non-negative values, supported-date rules, and authoritative server recalculation.
- Applied the additive contribution migration while retaining existing salary records, RLS ownership policies, lifecycle protections, authenticated grants, and anonymous revocation.
- Added focused tests for government boundaries, caps, allocation rounding, overrides, historical dates, PHP enforcement, and duplicate rejection.

## Completed: Phase 11 - Salary Calculator

- Added reusable salary profiles for employers, pay schedules, currencies, base pay, receiving accounts, income categories, and default pay components.
- Added weekly, biweekly, semi-monthly, and monthly pay-period suggestions without creating future transactions automatically.
- Added fixed, base-percentage, gross-percentage, and hourly multiplier calculations with per-component two-decimal rounding and focused unit coverage.
- Added salary drafts with historical component snapshots, editable payslip review, explicit posting, optional unposting, and year-to-date gross, deduction, and net summaries.
- Added atomic `post_salary_run` and `unpost_salary_run` database functions that create or remove exactly one completed net-income transaction.
- Protected salary-generated transactions from direct ledger edits and deletion, with Salary badges and links back to the originating record.
- Added RLS, ownership validation, authenticated grants, anonymous revocation, lifecycle triggers, and foreign-key indexes for all salary tables.
- Added Salary to desktop and mobile navigation and built the workspace with shadcn field, card, table, badge, alert, dialog, tabs, and empty-state primitives.

## Completed: Phase 10 - Production Hardening

- Added protected-route loading skeletons with stable responsive dimensions for dashboard and data-heavy navigation.
- Added a protected error boundary with a retry path that preserves financial data and a branded not-found route.
- Verified the public sign-in experience in real Chrome at desktop and mobile sizes, including HTTP response, metadata, content, and horizontal-overflow checks.
- Re-ran linting, strict TypeScript checks, all unit tests, and the optimized Next.js production build.
- Confirmed all database migrations are registered in the connected Supabase project and reviewed post-migration security and performance advisors.
- Completed final project and deployment documentation without adding PWA dependencies or service-role credentials.

## Completed: Phase 9 - Dashboard and Financial Reporting

- Rebuilt the overview as an original Monefy-inspired finance dashboard with a large expense-distribution donut, labeled category portions, period and currency controls, account balances, recent activity, and monthly cash flow.
- Added reusable reporting period, category-distribution, monthly cash-flow, total, and largest-activity calculations with focused unit coverage.
- Completed Reports with period, currency, account, category, and status filters; income sources; expense portions; cash-flow trends; largest activity; and authenticated filtered CSV export.
- Applied reporting indexes for the currency, status, category, and date combinations used by dashboard and report queries.
- Standardized dashboard, chart tooltip, report, table, balance, and export-facing numeric presentation around comma-separated monetary values.
- Used shadcn chart, card, field, select, table, badge, and button primitives throughout the finished reporting experience.

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
- Phase 2: Supabase SSR session handling, Google OAuth, profiles, and row-level security.
- Phase 1: Next.js foundation, dark-first shadcn theme setup, environment validation, and Supabase client scaffolding.

## Migrations

- `20260730054904_ph_government_contributions.sql`
- `20260730051236_salary_foreign_key_indexes.sql`
- `20260730045614_salary_calculator.sql`
- Phase 10: none.
- `20260730020000_phase_9_dashboard_reporting.sql`
- `20260730004903_phase_8_complete_finance_workflows.sql`
- Phase 7: none.
- `20260729080000_phase_6_preferences_deletion.sql`
- `20260729080500_phase_6_revoke_anon_access.sql`

## Operational Notes

- Account deletion is intentionally a recorded deletion request. Permanent Auth-user removal requires a secure administrative process outside the browser app; no service-role secret is shipped to the client.
- Supabase reports informational authenticated GraphQL discoverability notices because authenticated client queries are intentionally enabled and protected by row-level security.
- New indexes may be reported as unused until the production dataset and query history grow; they support foreign keys and expected ledger filtering.
- Gross salary and deductions stay in salary records; only net received pay is included in standard dashboard, account, report, activity, and CSV totals.
- Philippine contribution presets are estimates for personal planning and should be compared with the employer's payslip. They are not payroll, tax, or legal advice.

## Next Work

No product-development phase remains in the current plan. Future work is normal maintenance: production monitoring, user feedback, dependency updates, and optional features selected after real usage.
