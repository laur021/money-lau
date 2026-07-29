create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  institution_name text,
  account_type text not null check (account_type in ('bank', 'cash', 'savings', 'checking', 'credit_card', 'e_wallet', 'investment', 'other')),
  opening_balance numeric(18,2) not null default 0,
  currency text not null check (char_length(currency) = 3),
  account_identifier text check (account_identifier is null or char_length(account_identifier) <= 4),
  icon text,
  color text,
  include_in_total boolean not null default true,
  is_archived boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index accounts_user_id_idx on public.accounts(user_id);
create trigger accounts_set_updated_at before update on public.accounts for each row execute function public.set_updated_at();
alter table public.accounts enable row level security;
create policy "Users can read their accounts" on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their accounts" on public.accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their accounts" on public.accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.accounts to authenticated;

create function public.validate_category_parent_owner() returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$ begin
  if new.parent_category_id is not null and not exists (select 1 from public.categories parent where parent.id = new.parent_category_id and parent.user_id = new.user_id and parent.transaction_type = new.transaction_type) then raise exception 'Parent category must belong to the same user and type'; end if;
  return new;
end; $$;
create trigger categories_validate_parent_owner before insert or update of parent_category_id, user_id, transaction_type on public.categories for each row execute function public.validate_category_parent_owner();
