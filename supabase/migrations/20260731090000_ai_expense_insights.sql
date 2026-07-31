alter table public.profiles
  add column if not exists ai_insights_consent_at timestamptz;

create table public.ai_insight_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null check (char_length(model) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  created_at timestamptz not null default now()
);

create index ai_insight_usage_user_created_idx
  on public.ai_insight_usage (user_id, created_at desc);

alter table public.ai_insight_usage enable row level security;

create policy "Users can read their insight usage"
  on public.ai_insight_usage for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their insight usage"
  on public.ai_insight_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their insight usage"
  on public.ai_insight_usage for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their insight usage"
  on public.ai_insight_usage for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.ai_insight_usage from anon;
grant select, insert, update, delete on public.ai_insight_usage to authenticated;
