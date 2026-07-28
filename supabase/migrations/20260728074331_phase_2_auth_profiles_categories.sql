create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_currency text not null default 'PHP' check (char_length(default_currency) = 3),
  date_format text not null default 'MMM d, yyyy',
  timezone text not null default 'Asia/Manila',
  week_starts_on integer not null default 1 check (week_starts_on between 0 and 6),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  default_dashboard_period text not null default 'this_month',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  parent_category_id uuid references public.categories(id) on delete restrict,
  icon text,
  color text,
  is_system boolean not null default false,
  is_archived boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_user_id_idx on public.categories(user_id);
create index categories_parent_category_id_idx on public.categories(parent_category_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path = public, pg_temp as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();

create function public.create_default_categories_for_user(target_user_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$ begin
  if auth.uid() is not null and auth.uid() <> target_user_id then raise exception 'Cannot create categories for another user'; end if;
  insert into public.categories (user_id, name, transaction_type, icon, display_order, is_system) values
  (target_user_id, 'Food', 'expense', 'utensils', 10, true), (target_user_id, 'Transportation', 'expense', 'car', 20, true), (target_user_id, 'Shopping', 'expense', 'shopping-bag', 30, true), (target_user_id, 'Bills', 'expense', 'receipt', 40, true), (target_user_id, 'Housing', 'expense', 'house', 50, true), (target_user_id, 'Health', 'expense', 'heart-pulse', 60, true), (target_user_id, 'Entertainment', 'expense', 'film', 70, true), (target_user_id, 'Education', 'expense', 'graduation-cap', 80, true), (target_user_id, 'Family', 'expense', 'users', 90, true), (target_user_id, 'Travel', 'expense', 'plane', 100, true), (target_user_id, 'Personal Care', 'expense', 'sparkles', 110, true), (target_user_id, 'Subscriptions', 'expense', 'repeat-2', 120, true), (target_user_id, 'Debt Payments', 'expense', 'landmark', 130, true), (target_user_id, 'Other', 'expense', 'circle-ellipsis', 140, true), (target_user_id, 'Salary', 'income', 'briefcase-business', 10, true), (target_user_id, 'Bonus', 'income', 'gift', 20, true), (target_user_id, 'Business', 'income', 'store', 30, true), (target_user_id, 'Freelance', 'income', 'laptop', 40, true), (target_user_id, 'Investment', 'income', 'chart-no-axes-combined', 50, true), (target_user_id, 'Gift', 'income', 'heart', 60, true), (target_user_id, 'Refund', 'income', 'rotate-ccw', 70, true), (target_user_id, 'Other Income', 'income', 'circle-plus', 80, true);
end; $$;
revoke all on function public.create_default_categories_for_user(uuid) from public;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin
  insert into public.profiles (id, display_name, avatar_url) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), new.raw_user_meta_data ->> 'avatar_url');
  perform public.create_default_categories_for_user(new.id);
  return new;
end; $$;
revoke all on function public.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
create policy "Users can read their profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users can read their categories" on public.categories for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their categories" on public.categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their categories" on public.categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.categories to authenticated;
