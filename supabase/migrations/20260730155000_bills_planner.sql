create table public.bill_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  currency text not null check (char_length(currency) = 3 and currency = upper(currency)),
  default_amount numeric(18,2) not null check (default_amount > 0),
  due_day integer not null check (due_day between 1 and 31),
  default_account_id uuid references public.accounts(id) on delete restrict,
  default_category_id uuid references public.categories(id) on delete restrict,
  notes text check (notes is null or char_length(notes) <= 2000),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bill_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.bill_templates(id) on delete set null,
  source_bill_item_id uuid references public.bill_items(id) on delete set null,
  planner_month date not null,
  coverage_month date not null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  currency text not null check (char_length(currency) = 3 and currency = upper(currency)),
  planned_amount numeric(18,2) not null check (planned_amount > 0),
  actual_paid_amount numeric(18,2) check (actual_paid_amount is null or actual_paid_amount > 0),
  due_date date not null,
  payment_date date,
  account_id uuid references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  notes text check (notes is null or char_length(notes) <= 2000),
  transaction_id uuid unique references public.transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planner_month = date_trunc('month', planner_month)::date),
  check (coverage_month = date_trunc('month', coverage_month)::date),
  check (
    (transaction_id is null and actual_paid_amount is null and payment_date is null)
    or (transaction_id is not null and actual_paid_amount is not null and payment_date is not null)
  )
);

create unique index bill_items_template_month_unique_idx
  on public.bill_items (template_id, planner_month)
  where template_id is not null;
create index bill_templates_user_active_idx
  on public.bill_templates (user_id, is_archived, name);
create index bill_items_user_month_due_idx
  on public.bill_items (user_id, planner_month, due_date, name);
create index bill_items_user_coverage_month_idx
  on public.bill_items (user_id, coverage_month);
create index bill_items_account_idx on public.bill_items (account_id);
create index bill_items_category_idx on public.bill_items (category_id);

create trigger bill_templates_set_updated_at
  before update on public.bill_templates
  for each row execute function public.set_updated_at();
create trigger bill_items_set_updated_at
  before update on public.bill_items
  for each row execute function public.set_updated_at();

create function public.validate_bill_template()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.default_account_id is not null and not exists (
    select 1 from public.accounts account_row
    where account_row.id = new.default_account_id
      and account_row.user_id = new.user_id
      and not account_row.is_archived
      and account_row.currency = new.currency
  ) then
    raise exception 'Default bill account must belong to user, be active, and match currency';
  end if;

  if new.default_category_id is not null and not exists (
    select 1 from public.categories category_row
    where category_row.id = new.default_category_id
      and category_row.user_id = new.user_id
      and not category_row.is_archived
      and category_row.transaction_type = 'expense'
  ) then
    raise exception 'Default bill category must belong to user, be active, and be an expense category';
  end if;

  return new;
end;
$$;

create trigger bill_templates_validate
  before insert or update on public.bill_templates
  for each row execute function public.validate_bill_template();

create function public.validate_bill_item()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.template_id is not null and not exists (
    select 1 from public.bill_templates template_row
    where template_row.id = new.template_id
      and template_row.user_id = new.user_id
  ) then
    raise exception 'Bill template must belong to user';
  end if;

  if new.source_bill_item_id is not null and not exists (
    select 1 from public.bill_items source_row
    where source_row.id = new.source_bill_item_id
      and source_row.user_id = new.user_id
  ) then
    raise exception 'Source bill item must belong to user';
  end if;

  if new.account_id is not null and not exists (
    select 1 from public.accounts account_row
    where account_row.id = new.account_id
      and account_row.user_id = new.user_id
      and not account_row.is_archived
      and account_row.currency = new.currency
  ) then
    raise exception 'Bill account must belong to user, be active, and match currency';
  end if;

  if new.category_id is not null and not exists (
    select 1 from public.categories category_row
    where category_row.id = new.category_id
      and category_row.user_id = new.user_id
      and not category_row.is_archived
      and category_row.transaction_type = 'expense'
  ) then
    raise exception 'Bill category must belong to user, be active, and be an expense category';
  end if;

  return new;
end;
$$;

create trigger bill_items_validate
  before insert or update on public.bill_items
  for each row execute function public.validate_bill_item();

create function public.protect_bill_item_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bill_operation text := current_setting('moneylau.bill_operation', true);
begin
  if tg_op = 'DELETE' and old.transaction_id is not null then
    raise exception 'Paid bill items must be unposted before deletion';
  end if;

  if tg_op = 'UPDATE' then
    if old.transaction_id is not null and bill_operation <> 'unpost' then
      raise exception 'Paid bill items are read-only until unposted';
    end if;

    if old.transaction_id is null and new.transaction_id is not null and bill_operation <> 'post' then
      raise exception 'Bill items must be posted with post_bill_payment';
    end if;

    if new.transaction_id is null
      and (new.actual_paid_amount is not null or new.payment_date is not null)
    then
      raise exception 'Payment details require a linked transaction';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger bill_items_protect_lifecycle
  before update or delete on public.bill_items
  for each row execute function public.protect_bill_item_lifecycle();

create or replace function public.protect_salary_generated_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.salary_runs run_row where run_row.transaction_id = old.id)
    or exists (select 1 from public.bill_items bill_row where bill_row.transaction_id = old.id)
  then
    raise exception 'Generated transactions must be changed from their source record';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create function public.generate_bill_month(target_month date)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  created_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if target_month <> date_trunc('month', target_month)::date then
    raise exception 'Planner month must be the first day of a month';
  end if;

  insert into public.bill_items (
    user_id, template_id, planner_month, coverage_month, name, currency,
    planned_amount, due_date, account_id, category_id, notes
  )
  select
    template_row.user_id,
    template_row.id,
    target_month,
    target_month,
    template_row.name,
    template_row.currency,
    template_row.default_amount,
    make_date(
      extract(year from target_month)::integer,
      extract(month from target_month)::integer,
      least(
        template_row.due_day,
        extract(day from (target_month + interval '1 month - 1 day'))::integer
      )
    ),
    template_row.default_account_id,
    template_row.default_category_id,
    template_row.notes
  from public.bill_templates template_row
  where template_row.user_id = (select auth.uid())
    and not template_row.is_archived
  on conflict (template_id, planner_month) where template_id is not null do nothing;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

create function public.duplicate_bill_item(
  source_bill_item_id uuid,
  target_month date,
  target_name text
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  source_row public.bill_items%rowtype;
  created_id uuid;
  month_offset integer;
  target_coverage_month date;
  target_due_date date;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if target_month <> date_trunc('month', target_month)::date then
    raise exception 'Planner month must be the first day of a month';
  end if;

  select * into source_row
  from public.bill_items
  where id = source_bill_item_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Bill item not found';
  end if;

  month_offset :=
    (extract(year from target_month)::integer - extract(year from source_row.planner_month)::integer) * 12
    + extract(month from target_month)::integer - extract(month from source_row.planner_month)::integer;
  target_coverage_month := date_trunc(
    'month',
    source_row.coverage_month + make_interval(months => month_offset)
  )::date;
  target_due_date := make_date(
    extract(year from target_month)::integer,
    extract(month from target_month)::integer,
    least(
      extract(day from source_row.due_date)::integer,
      extract(day from (target_month + interval '1 month - 1 day'))::integer
    )
  );

  insert into public.bill_items (
    user_id, template_id, source_bill_item_id, planner_month, coverage_month,
    name, currency, planned_amount, due_date, account_id, category_id, notes
  )
  values (
    source_row.user_id, source_row.template_id, source_row.id, target_month,
    target_coverage_month, coalesce(nullif(trim(target_name), ''), source_row.name),
    source_row.currency, source_row.planned_amount, target_due_date,
    source_row.account_id, source_row.category_id, source_row.notes
  )
  returning id into created_id;

  return created_id;
end;
$$;

create function public.post_bill_payment(
  target_bill_item_id uuid,
  paid_amount numeric,
  paid_on date,
  paid_account_id uuid,
  paid_category_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bill_row public.bill_items%rowtype;
  created_transaction_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if paid_amount is null or paid_amount <= 0 or paid_on is null then
    raise exception 'A positive payment amount and payment date are required';
  end if;

  select * into bill_row
  from public.bill_items
  where id = target_bill_item_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Bill item not found';
  end if;

  if bill_row.transaction_id is not null then
    raise exception 'Bill item is already paid';
  end if;

  if not exists (
    select 1 from public.accounts account_row
    where account_row.id = paid_account_id
      and account_row.user_id = bill_row.user_id
      and not account_row.is_archived
      and account_row.currency = bill_row.currency
  ) then
    raise exception 'Payment account must be active and match the bill currency';
  end if;

  if not exists (
    select 1 from public.categories category_row
    where category_row.id = paid_category_id
      and category_row.user_id = bill_row.user_id
      and not category_row.is_archived
      and category_row.transaction_type = 'expense'
  ) then
    raise exception 'Payment category must be active and be an expense category';
  end if;

  insert into public.transactions (
    user_id, transaction_type, account_id, category_id, amount, currency,
    transaction_date, description, merchant, reference_number, status
  )
  values (
    bill_row.user_id, 'expense', paid_account_id, paid_category_id, paid_amount,
    bill_row.currency, paid_on::timestamptz,
    'Bill for ' || to_char(bill_row.coverage_month, 'Mon YYYY'), bill_row.name,
    'BILL-' || upper(left(bill_row.id::text, 8)), 'completed'
  )
  returning id into created_transaction_id;

  perform set_config('moneylau.bill_operation', 'post', true);
  update public.bill_items
  set transaction_id = created_transaction_id,
      actual_paid_amount = paid_amount,
      payment_date = paid_on,
      account_id = paid_account_id,
      category_id = paid_category_id
  where id = bill_row.id;

  return created_transaction_id;
end;
$$;

create function public.unpost_bill_payment(target_bill_item_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bill_row public.bill_items%rowtype;
  removed_transaction_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select * into bill_row
  from public.bill_items
  where id = target_bill_item_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Bill item not found';
  end if;

  if bill_row.transaction_id is null then
    raise exception 'Bill item is not paid';
  end if;

  removed_transaction_id := bill_row.transaction_id;
  perform set_config('moneylau.bill_operation', 'unpost', true);
  update public.bill_items
  set transaction_id = null,
      actual_paid_amount = null,
      payment_date = null
  where id = bill_row.id;

  delete from public.transactions
  where id = removed_transaction_id
    and user_id = bill_row.user_id;

  if not found then
    raise exception 'Linked bill transaction could not be removed';
  end if;

  return removed_transaction_id;
end;
$$;

alter table public.bill_templates enable row level security;
alter table public.bill_items enable row level security;

create policy "Users can read their bill templates"
  on public.bill_templates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their bill templates"
  on public.bill_templates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their bill templates"
  on public.bill_templates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their bill templates"
  on public.bill_templates for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their bill items"
  on public.bill_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their bill items"
  on public.bill_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their bill items"
  on public.bill_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their bill items"
  on public.bill_items for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.bill_templates from anon;
revoke all on public.bill_items from anon;
grant select, insert, update, delete on public.bill_templates to authenticated;
grant select, insert, update, delete on public.bill_items to authenticated;

revoke all on function public.generate_bill_month(date) from public, anon;
revoke all on function public.duplicate_bill_item(uuid, date, text) from public, anon;
revoke all on function public.post_bill_payment(uuid, numeric, date, uuid, uuid) from public, anon;
revoke all on function public.unpost_bill_payment(uuid) from public, anon;
grant execute on function public.generate_bill_month(date) to authenticated;
grant execute on function public.duplicate_bill_item(uuid, date, text) to authenticated;
grant execute on function public.post_bill_payment(uuid, numeric, date, uuid, uuid) to authenticated;
grant execute on function public.unpost_bill_payment(uuid) to authenticated;
