# MoneyLau

MoneyLau is a privacy-conscious, manual personal finance manager built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. It supports Google sign-in, multiple accounts and currencies, income, expenses, transfers, categories, reports, CSV export, onboarding, and personal preferences.

## Stack

- Next.js App Router, Server Components, Server Actions, and Route Handlers
- TypeScript, Tailwind CSS, and the shadcn Radix Nova theme
- Supabase Auth, PostgreSQL, Row Level Security, and SSR clients
- Zod validation, Recharts, date-fns, Lucide icons, and Vitest

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project API settings.
3. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
4. Apply the SQL files in `supabase/migrations` to the same Supabase project in filename order.
5. Configure Google in Supabase as described in [docs/AUTHENTICATION_SETUP.md](docs/AUTHENTICATION_SETUP.md).
6. Run `npm install` and then `npm run dev`.

Open [http://localhost:3000](http://localhost:3000). The protected application requires a working Google provider configuration.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these commands for `main`, feature branches, and pull requests.

## Deployment

The application is configured for Vercel with `vercel.json`. Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to connect the repository, set public environment values, configure Supabase redirect URLs, and configure the Google OAuth client. Never add a Supabase service-role key or a Google OAuth secret to Vercel or GitHub source files.

## Security notes

- Database rows are protected by Supabase Row Level Security.
- Anonymous database access is explicitly revoked for finance tables and views.
- `NEXT_PUBLIC_*` values are public client configuration, not secrets.
- The account-deletion button records a review request; permanent Auth-user deletion requires a secure administrative process.

Implementation history and known limitations are tracked in [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
