create index if not exists transactions_user_currency_date_idx
  on public.transactions (user_id, currency, transaction_date desc);

create index if not exists transactions_user_status_date_idx
  on public.transactions (user_id, status, transaction_date desc);

create index if not exists transactions_user_category_date_idx
  on public.transactions (user_id, category_id, transaction_date desc)
  where category_id is not null;
