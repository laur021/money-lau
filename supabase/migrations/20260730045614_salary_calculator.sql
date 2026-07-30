create table public.salary_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  employer_name text not null check (char_length(trim(employer_name)) between 1 and 160),
  job_title text check (job_title is null or char_length(trim(job_title)) between 1 and 120),
  currency text not null check (char_length(currency) = 3 and currency = upper(currency)),
  pay_frequency text not null check (
    pay_frequency in ('weekly', 'biweekly', 'semi_monthly', 'monthly')
  ),
  base_pay numeric(18,2) not null check (base_pay >= 0),
  default_account_id uuid not null references public.accounts(id) on delete restrict,
  default_income_category_id uuid not null references public.categories(id) on delete restrict,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salary_profile_components (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.salary_profiles(id) on delete cascade,
  component_kind text not null check (component_kind in ('earning', 'deduction')),
  name text not null check (char_length(trim(name)) between 1 and 100),
  calculation_type text not null check (
    calculation_type in ('fixed', 'percentage_base', 'percentage_gross', 'hourly')
  ),
  fixed_amount numeric(18,2),
  percentage numeric(9,4),
  hours numeric(12,2),
  hourly_rate numeric(18,2),
  multiplier numeric(8,4),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      calculation_type = 'fixed'
      and fixed_amount is not null
      and fixed_amount >= 0
    )
    or (
      calculation_type in ('percentage_base', 'percentage_gross')
      and percentage is not null
      and percentage >= 0
    )
    or (
      calculation_type = 'hourly'
      and component_kind = 'earning'
      and hours is not null
      and hours >= 0
      and hourly_rate is not null
      and hourly_rate >= 0
      and multiplier is not null
      and multiplier >= 0
    )
  ),
  check (calculation_type <> 'percentage_gross' or component_kind = 'deduction')
);

create table public.salary_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.salary_profiles(id) on delete restrict,
  profile_name text not null check (char_length(trim(profile_name)) between 1 and 100),
  employer_name text not null check (char_length(trim(employer_name)) between 1 and 160),
  job_title text check (job_title is null or char_length(trim(job_title)) between 1 and 120),
  pay_frequency text not null check (
    pay_frequency in ('weekly', 'biweekly', 'semi_monthly', 'monthly')
  ),
  currency text not null check (char_length(currency) = 3 and currency = upper(currency)),
  account_id uuid not null references public.accounts(id) on delete restrict,
  income_category_id uuid not null references public.categories(id) on delete restrict,
  pay_period_start date not null,
  pay_period_end date not null,
  payment_date date not null,
  base_pay numeric(18,2) not null check (base_pay >= 0),
  gross_pay numeric(18,2) not null check (gross_pay >= 0),
  total_deductions numeric(18,2) not null check (total_deductions >= 0),
  net_pay numeric(18,2) not null check (net_pay >= 0),
  notes text check (notes is null or char_length(notes) <= 2000),
  transaction_id uuid unique references public.transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pay_period_start <= pay_period_end),
  check (gross_pay >= total_deductions),
  check (net_pay = gross_pay - total_deductions)
);

create table public.salary_run_components (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  salary_run_id uuid not null references public.salary_runs(id) on delete cascade,
  source_profile_component_id uuid references public.salary_profile_components(id) on delete set null,
  component_kind text not null check (component_kind in ('earning', 'deduction')),
  name text not null check (char_length(trim(name)) between 1 and 100),
  calculation_type text not null check (
    calculation_type in ('fixed', 'percentage_base', 'percentage_gross', 'hourly')
  ),
  fixed_amount numeric(18,2),
  percentage numeric(9,4),
  hours numeric(12,2),
  hourly_rate numeric(18,2),
  multiplier numeric(8,4),
  calculated_amount numeric(18,2) not null check (calculated_amount >= 0),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      calculation_type = 'fixed'
      and fixed_amount is not null
      and fixed_amount >= 0
    )
    or (
      calculation_type in ('percentage_base', 'percentage_gross')
      and percentage is not null
      and percentage >= 0
    )
    or (
      calculation_type = 'hourly'
      and component_kind = 'earning'
      and hours is not null
      and hours >= 0
      and hourly_rate is not null
      and hourly_rate >= 0
      and multiplier is not null
      and multiplier >= 0
    )
  ),
  check (calculation_type <> 'percentage_gross' or component_kind = 'deduction')
);

create index salary_profiles_user_active_idx
  on public.salary_profiles (user_id, is_archived, name);
create index salary_profile_components_profile_idx
  on public.salary_profile_components (profile_id, display_order);
create index salary_profile_components_user_idx
  on public.salary_profile_components (user_id);
create index salary_runs_user_payment_date_idx
  on public.salary_runs (user_id, payment_date desc);
create index salary_runs_profile_payment_date_idx
  on public.salary_runs (profile_id, payment_date desc);
create index salary_runs_user_draft_idx
  on public.salary_runs (user_id, created_at desc)
  where transaction_id is null;
create index salary_run_components_run_idx
  on public.salary_run_components (salary_run_id, display_order);
create index salary_run_components_user_idx
  on public.salary_run_components (user_id);

create trigger salary_profiles_set_updated_at
  before update on public.salary_profiles
  for each row execute function public.set_updated_at();
create trigger salary_profile_components_set_updated_at
  before update on public.salary_profile_components
  for each row execute function public.set_updated_at();
create trigger salary_runs_set_updated_at
  before update on public.salary_runs
  for each row execute function public.set_updated_at();
create trigger salary_run_components_set_updated_at
  before update on public.salary_run_components
  for each row execute function public.set_updated_at();

create function public.validate_salary_profile()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.accounts account_row
    where account_row.id = new.default_account_id
      and account_row.user_id = new.user_id
      and account_row.currency = new.currency
      and (
        not account_row.is_archived
        or (
          tg_op = 'UPDATE'
          and old.default_account_id = new.default_account_id
          and old.currency = new.currency
        )
      )
  ) then
    raise exception 'Default salary account must belong to user, be active, and match currency';
  end if;

  if not exists (
    select 1
    from public.categories category_row
    where category_row.id = new.default_income_category_id
      and category_row.user_id = new.user_id
      and category_row.transaction_type = 'income'
      and (
        not category_row.is_archived
        or (
          tg_op = 'UPDATE'
          and old.default_income_category_id = new.default_income_category_id
        )
      )
  ) then
    raise exception 'Default salary category must belong to user, be active, and be income';
  end if;

  return new;
end;
$$;

create trigger salary_profiles_validate
  before insert or update on public.salary_profiles
  for each row execute function public.validate_salary_profile();

create function public.validate_salary_profile_component()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.salary_profiles profile_row
    where profile_row.id = new.profile_id
      and profile_row.user_id = new.user_id
  ) then
    raise exception 'Salary component profile must belong to user';
  end if;

  return new;
end;
$$;

create trigger salary_profile_components_validate
  before insert or update on public.salary_profile_components
  for each row execute function public.validate_salary_profile_component();

create function public.validate_salary_run()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.salary_profiles profile_row
    where profile_row.id = new.profile_id
      and profile_row.user_id = new.user_id
      and (
        not profile_row.is_archived
        or (tg_op = 'UPDATE' and old.profile_id = new.profile_id)
      )
  ) then
    raise exception 'Salary profile must belong to user and be active';
  end if;

  if not exists (
    select 1
    from public.accounts account_row
    where account_row.id = new.account_id
      and account_row.user_id = new.user_id
      and account_row.currency = new.currency
      and (
        not account_row.is_archived
        or (
          tg_op = 'UPDATE'
          and old.account_id = new.account_id
          and old.currency = new.currency
        )
      )
  ) then
    raise exception 'Salary account must belong to user, be active, and match currency';
  end if;

  if not exists (
    select 1
    from public.categories category_row
    where category_row.id = new.income_category_id
      and category_row.user_id = new.user_id
      and category_row.transaction_type = 'income'
      and (
        not category_row.is_archived
        or (
          tg_op = 'UPDATE'
          and old.income_category_id = new.income_category_id
        )
      )
  ) then
    raise exception 'Salary category must belong to user, be active, and be income';
  end if;

  return new;
end;
$$;

create trigger salary_runs_validate
  before insert or update on public.salary_runs
  for each row execute function public.validate_salary_run();

create function public.validate_salary_run_component()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.salary_runs run_row
    where run_row.id = new.salary_run_id
      and run_row.user_id = new.user_id
      and run_row.transaction_id is null
  ) then
    raise exception 'Salary run component must belong to an editable draft';
  end if;

  if new.source_profile_component_id is not null and not exists (
    select 1
    from public.salary_profile_components component_row
    where component_row.id = new.source_profile_component_id
      and component_row.user_id = new.user_id
  ) then
    raise exception 'Source salary component must belong to user';
  end if;

  return new;
end;
$$;

create trigger salary_run_components_validate
  before insert or update on public.salary_run_components
  for each row execute function public.validate_salary_run_component();

create function public.protect_posted_salary_run_component()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.salary_runs run_row
    where run_row.id = old.salary_run_id
      and run_row.transaction_id is not null
  ) then
    raise exception 'Posted salary run components are read-only until unposted';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger salary_run_components_protect_posted
  before update or delete on public.salary_run_components
  for each row execute function public.protect_posted_salary_run_component();

create function public.protect_salary_run_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  salary_operation text := current_setting('moneylau.salary_operation', true);
begin
  if tg_op = 'DELETE' and old.transaction_id is not null then
    raise exception 'Posted salary runs must be unposted before deletion';
  end if;

  if tg_op = 'UPDATE' then
    if old.transaction_id is not null and salary_operation <> 'unpost' then
      raise exception 'Posted salary runs are read-only until unposted';
    end if;

    if old.transaction_id is null
      and new.transaction_id is not null
      and salary_operation <> 'post'
    then
      raise exception 'Salary runs must be posted with post_salary_run';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger salary_runs_protect_lifecycle
  before update or delete on public.salary_runs
  for each row execute function public.protect_salary_run_lifecycle();

create function public.protect_salary_generated_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.salary_runs run_row
    where run_row.transaction_id = old.id
  ) then
    raise exception 'Salary transactions must be changed from the salary record';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger transactions_protect_salary_generated
  before update or delete on public.transactions
  for each row execute function public.protect_salary_generated_transaction();

alter table public.salary_profiles enable row level security;
alter table public.salary_profile_components enable row level security;
alter table public.salary_runs enable row level security;
alter table public.salary_run_components enable row level security;

create policy "Users can read their salary profiles"
  on public.salary_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their salary profiles"
  on public.salary_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their salary profiles"
  on public.salary_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their salary profiles"
  on public.salary_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their salary profile components"
  on public.salary_profile_components for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their salary profile components"
  on public.salary_profile_components for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their salary profile components"
  on public.salary_profile_components for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their salary profile components"
  on public.salary_profile_components for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their salary runs"
  on public.salary_runs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their salary runs"
  on public.salary_runs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their salary runs"
  on public.salary_runs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their salary runs"
  on public.salary_runs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their salary run components"
  on public.salary_run_components for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their salary run components"
  on public.salary_run_components for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their salary run components"
  on public.salary_run_components for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their salary run components"
  on public.salary_run_components for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.salary_profiles to authenticated;
grant select, insert, update, delete on public.salary_profile_components to authenticated;
grant select, insert, update, delete on public.salary_runs to authenticated;
grant select, insert, update, delete on public.salary_run_components to authenticated;

revoke all on public.salary_profiles from anon;
revoke all on public.salary_profile_components from anon;
revoke all on public.salary_runs from anon;
revoke all on public.salary_run_components from anon;

create function public.post_salary_run(target_salary_run_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  salary_row public.salary_runs%rowtype;
  created_transaction_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select *
  into salary_row
  from public.salary_runs
  where id = target_salary_run_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Salary run not found';
  end if;

  if salary_row.transaction_id is not null then
    raise exception 'Salary run is already posted';
  end if;

  if salary_row.net_pay <= 0 then
    raise exception 'Net pay must be greater than zero before posting';
  end if;

  if not exists (
    select 1
    from public.accounts account_row
    where account_row.id = salary_row.account_id
      and account_row.user_id = salary_row.user_id
      and account_row.currency = salary_row.currency
      and not account_row.is_archived
  ) then
    raise exception 'Salary account must be active and match the salary currency';
  end if;

  if not exists (
    select 1
    from public.categories category_row
    where category_row.id = salary_row.income_category_id
      and category_row.user_id = salary_row.user_id
      and category_row.transaction_type = 'income'
      and not category_row.is_archived
  ) then
    raise exception 'Salary category must be active and be an income category';
  end if;

  insert into public.transactions (
    user_id,
    transaction_type,
    account_id,
    category_id,
    amount,
    currency,
    transaction_date,
    description,
    merchant,
    reference_number,
    status
  )
  values (
    salary_row.user_id,
    'income',
    salary_row.account_id,
    salary_row.income_category_id,
    salary_row.net_pay,
    salary_row.currency,
    salary_row.payment_date::timestamptz,
    salary_row.profile_name || ' salary',
    salary_row.employer_name,
    'SAL-' || upper(left(salary_row.id::text, 8)),
    'completed'
  )
  returning id into created_transaction_id;

  perform set_config('moneylau.salary_operation', 'post', true);

  update public.salary_runs
  set transaction_id = created_transaction_id
  where id = salary_row.id;

  return created_transaction_id;
end;
$$;

create function public.unpost_salary_run(target_salary_run_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  salary_row public.salary_runs%rowtype;
  removed_transaction_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select *
  into salary_row
  from public.salary_runs
  where id = target_salary_run_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Salary run not found';
  end if;

  if salary_row.transaction_id is null then
    raise exception 'Salary run is not posted';
  end if;

  removed_transaction_id := salary_row.transaction_id;
  perform set_config('moneylau.salary_operation', 'unpost', true);

  update public.salary_runs
  set transaction_id = null
  where id = salary_row.id;

  delete from public.transactions
  where id = removed_transaction_id
    and user_id = salary_row.user_id;

  if not found then
    raise exception 'Linked salary transaction could not be removed';
  end if;

  return removed_transaction_id;
end;
$$;

revoke all on function public.post_salary_run(uuid) from public, anon;
revoke all on function public.unpost_salary_run(uuid) from public, anon;
grant execute on function public.post_salary_run(uuid) to authenticated;
grant execute on function public.unpost_salary_run(uuid) to authenticated;
