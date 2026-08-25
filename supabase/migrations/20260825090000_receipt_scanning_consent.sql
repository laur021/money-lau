alter table public.profiles
  add column if not exists receipt_scanning_consent_at timestamptz;
