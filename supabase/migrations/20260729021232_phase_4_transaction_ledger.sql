create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('income','expense','transfer')),
  account_id uuid not null references public.accounts(id) on delete restrict,
  destination_account_id uuid references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0), currency text not null check (char_length(currency) = 3),
  transaction_date timestamptz not null default now(), description text, merchant text, reference_number text,
  status text not null default 'completed' check (status in ('completed','pending','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((transaction_type = 'transfer' and destination_account_id is not null and destination_account_id <> account_id and category_id is null) or (transaction_type in ('income','expense') and destination_account_id is null and category_id is not null))
);
create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create trigger transactions_set_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create function public.validate_transaction() returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$ begin
  if not exists (select 1 from public.accounts a where a.id = new.account_id and a.user_id = new.user_id and not a.is_archived and a.currency = new.currency) then raise exception 'Source account must belong to user, be active, and match currency'; end if;
  if new.destination_account_id is not null and not exists (select 1 from public.accounts a where a.id = new.destination_account_id and a.user_id = new.user_id and not a.is_archived and a.currency = new.currency) then raise exception 'Destination account must belong to user, be active, and match currency'; end if;
  if new.category_id is not null and not exists (select 1 from public.categories c where c.id = new.category_id and c.user_id = new.user_id and not c.is_archived and c.transaction_type = new.transaction_type) then raise exception 'Category must belong to user, be active, and match transaction type'; end if;
  return new; end; $$;
create trigger transactions_validate before insert or update on public.transactions for each row execute function public.validate_transaction();
alter table public.transactions enable row level security;
create policy "Users can read their transactions" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their transactions" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their transactions" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.transactions to authenticated;
create view public.account_balances with (security_invoker = true) as select a.id, a.user_id, a.currency, a.opening_balance + coalesce(sum(case when t.status = 'completed' and t.transaction_type = 'income' then t.amount when t.status = 'completed' and t.transaction_type = 'expense' then -t.amount when t.status = 'completed' and t.transaction_type = 'transfer' then -t.amount else 0 end),0) + coalesce(sum(case when t.status = 'completed' and t.transaction_type = 'transfer' and t.destination_account_id = a.id then t.amount else 0 end),0) as current_balance from public.accounts a left join public.transactions t on t.account_id = a.id or t.destination_account_id = a.id group by a.id;
