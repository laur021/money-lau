revoke all on table public.profiles from anon;
revoke all on table public.categories from anon;
revoke all on table public.accounts from anon;
revoke all on table public.transactions from anon;
revoke all on table public.account_balances from anon;

grant select on table public.account_balances to authenticated;
