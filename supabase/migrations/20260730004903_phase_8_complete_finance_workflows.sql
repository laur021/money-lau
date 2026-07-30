create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  created_at timestamptz not null default now()
);

create unique index tags_user_name_idx on public.tags (user_id, lower(name));
create index tags_user_id_idx on public.tags (user_id);

alter table public.tags enable row level security;

create policy "Users can read their tags"
  on public.tags for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their tags"
  on public.tags for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their tags"
  on public.tags for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their tags"
  on public.tags for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

create index transaction_tags_tag_id_idx on public.transaction_tags (tag_id);

alter table public.transaction_tags enable row level security;

create policy "Users can read their transaction tags"
  on public.transaction_tags for select to authenticated
  using (
    exists (
      select 1 from public.transactions transaction_row
      where transaction_row.id = transaction_id
        and transaction_row.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags tag_row
      where tag_row.id = tag_id
        and tag_row.user_id = (select auth.uid())
    )
  );

create policy "Users can create their transaction tags"
  on public.transaction_tags for insert to authenticated
  with check (
    exists (
      select 1 from public.transactions transaction_row
      where transaction_row.id = transaction_id
        and transaction_row.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags tag_row
      where tag_row.id = tag_id
        and tag_row.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their transaction tags"
  on public.transaction_tags for delete to authenticated
  using (
    exists (
      select 1 from public.transactions transaction_row
      where transaction_row.id = transaction_id
        and transaction_row.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their transactions"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, delete on public.transaction_tags to authenticated;
grant delete on public.transactions to authenticated;

revoke all on public.tags from anon;
revoke all on public.transaction_tags from anon;

create index if not exists transactions_account_id_idx
  on public.transactions (account_id);
create index if not exists transactions_destination_account_id_idx
  on public.transactions (destination_account_id)
  where destination_account_id is not null;
create index if not exists transactions_category_id_idx
  on public.transactions (category_id)
  where category_id is not null;

create or replace function public.validate_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.accounts account_row
    where account_row.id = new.account_id
      and account_row.user_id = new.user_id
      and account_row.currency = new.currency
      and (not account_row.is_archived or (tg_op = 'UPDATE' and old.account_id = new.account_id))
  ) then
    raise exception 'Source account must belong to user, be active, and match currency';
  end if;

  if new.destination_account_id is not null and not exists (
    select 1 from public.accounts account_row
    where account_row.id = new.destination_account_id
      and account_row.user_id = new.user_id
      and account_row.currency = new.currency
      and (
        not account_row.is_archived
        or (tg_op = 'UPDATE' and old.destination_account_id = new.destination_account_id)
      )
  ) then
    raise exception 'Destination account must belong to user, be active, and match currency';
  end if;

  if new.category_id is not null and not exists (
    select 1 from public.categories category_row
    where category_row.id = new.category_id
      and category_row.user_id = new.user_id
      and category_row.transaction_type = new.transaction_type
      and (not category_row.is_archived or (tg_op = 'UPDATE' and old.category_id = new.category_id))
  ) then
    raise exception 'Category must belong to user, be active, and match transaction type';
  end if;

  return new;
end;
$$;
