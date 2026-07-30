alter table public.salary_profiles
  add column monthly_basic_salary numeric(18,2),
  add column monthly_compensation numeric(18,2),
  add column government_contribution_allocation text,
  add constraint salary_profiles_monthly_basic_salary_check
    check (monthly_basic_salary is null or monthly_basic_salary >= 0),
  add constraint salary_profiles_monthly_compensation_check
    check (monthly_compensation is null or monthly_compensation >= 0),
  add constraint salary_profiles_government_allocation_check
    check (
      government_contribution_allocation is null
      or government_contribution_allocation in ('full', 'half', 'quarter')
    );

alter table public.salary_runs
  add column monthly_basic_salary numeric(18,2),
  add column monthly_compensation numeric(18,2),
  add column government_contribution_allocation text,
  add constraint salary_runs_monthly_basic_salary_check
    check (monthly_basic_salary is null or monthly_basic_salary >= 0),
  add constraint salary_runs_monthly_compensation_check
    check (monthly_compensation is null or monthly_compensation >= 0),
  add constraint salary_runs_government_allocation_check
    check (
      government_contribution_allocation is null
      or government_contribution_allocation in ('full', 'half', 'quarter')
    );

alter table public.salary_profile_components
  add column government_preset_code text,
  add column government_rule_version text,
  add column government_monthly_amount numeric(18,2),
  add column government_allocation_fraction numeric(5,4),
  add column government_override_amount numeric(18,2);

alter table public.salary_run_components
  add column government_preset_code text,
  add column government_rule_version text,
  add column government_monthly_amount numeric(18,2),
  add column government_allocation_fraction numeric(5,4),
  add column government_override_amount numeric(18,2);

alter table public.salary_profile_components
  drop constraint salary_profile_components_calculation_type_check,
  drop constraint salary_profile_components_check,
  add constraint salary_profile_components_calculation_type_check
    check (
      calculation_type in (
        'fixed',
        'percentage_base',
        'percentage_gross',
        'hourly',
        'government_preset'
      )
    ),
  add constraint salary_profile_components_value_shape_check
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
      or (
        calculation_type = 'government_preset'
        and component_kind = 'deduction'
        and government_preset_code in (
          'ph_sss_employee',
          'ph_philhealth_employee',
          'ph_pagibig_employee'
        )
        and government_rule_version is not null
        and government_monthly_amount is not null
        and government_monthly_amount >= 0
        and government_allocation_fraction in (1.0000, 0.5000, 0.2500)
        and (
          government_override_amount is null
          or government_override_amount >= 0
        )
      )
    );

alter table public.salary_run_components
  drop constraint salary_run_components_calculation_type_check,
  drop constraint salary_run_components_check,
  add constraint salary_run_components_calculation_type_check
    check (
      calculation_type in (
        'fixed',
        'percentage_base',
        'percentage_gross',
        'hourly',
        'government_preset'
      )
    ),
  add constraint salary_run_components_value_shape_check
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
      or (
        calculation_type = 'government_preset'
        and component_kind = 'deduction'
        and government_preset_code in (
          'ph_sss_employee',
          'ph_philhealth_employee',
          'ph_pagibig_employee'
        )
        and government_rule_version is not null
        and government_monthly_amount is not null
        and government_monthly_amount >= 0
        and government_allocation_fraction in (1.0000, 0.5000, 0.2500)
        and (
          government_override_amount is null
          or government_override_amount >= 0
        )
      )
    );

create unique index salary_profile_components_government_preset_idx
  on public.salary_profile_components (profile_id, government_preset_code)
  where calculation_type = 'government_preset';

create unique index salary_run_components_government_preset_idx
  on public.salary_run_components (salary_run_id, government_preset_code)
  where calculation_type = 'government_preset';

create or replace function public.validate_salary_profile_component()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  profile_row public.salary_profiles%rowtype;
begin
  select *
  into profile_row
  from public.salary_profiles
  where id = new.profile_id
    and user_id = new.user_id;

  if not found then
    raise exception 'Salary component profile must belong to user';
  end if;

  if new.calculation_type = 'government_preset'
    and (
      profile_row.currency <> 'PHP'
      or profile_row.monthly_basic_salary is null
      or profile_row.monthly_compensation is null
      or profile_row.government_contribution_allocation is null
    )
  then
    raise exception 'Philippine government presets require a PHP profile and contribution settings';
  end if;

  return new;
end;
$$;

create or replace function public.validate_salary_run_component()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  run_row public.salary_runs%rowtype;
begin
  select *
  into run_row
  from public.salary_runs
  where id = new.salary_run_id
    and user_id = new.user_id
    and transaction_id is null;

  if not found then
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

  if new.calculation_type = 'government_preset'
    and (
      run_row.currency <> 'PHP'
      or run_row.monthly_basic_salary is null
      or run_row.monthly_compensation is null
      or run_row.government_contribution_allocation is null
    )
  then
    raise exception 'Philippine government presets require a PHP salary run and contribution settings';
  end if;

  return new;
end;
$$;
