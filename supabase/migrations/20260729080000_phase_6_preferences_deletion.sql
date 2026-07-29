alter table public.profiles
  add column if not exists number_format text not null default '1,234.56'
    check (number_format in ('1,234.56', '1.234,56')),
  add column if not exists show_archived_accounts boolean not null default false,
  add column if not exists show_archived_categories boolean not null default false,
  add column if not exists deletion_requested_at timestamptz;
