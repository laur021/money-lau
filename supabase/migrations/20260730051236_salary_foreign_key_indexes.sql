create index salary_profiles_default_account_idx
  on public.salary_profiles (default_account_id);
create index salary_profiles_default_income_category_idx
  on public.salary_profiles (default_income_category_id);
create index salary_runs_account_idx
  on public.salary_runs (account_id);
create index salary_runs_income_category_idx
  on public.salary_runs (income_category_id);
create index salary_run_components_source_profile_idx
  on public.salary_run_components (source_profile_component_id)
  where source_profile_component_id is not null;
