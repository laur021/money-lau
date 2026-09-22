-- account_balances joins transactions by either account column while RLS scopes
-- the result to the signed-in user. These partial indexes keep that aggregate
-- from scanning unrelated or non-completed ledger rows.
create index if not exists transactions_user_account_completed_idx
  on public.transactions (user_id, account_id)
  where status = 'completed';

create index if not exists transactions_user_destination_account_completed_idx
  on public.transactions (user_id, destination_account_id)
  where status = 'completed' and destination_account_id is not null;
