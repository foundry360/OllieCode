alter table public.profiles
  add column if not exists birth_date date;

comment on column public.profiles.birth_date is 'Set at signup when parent approves (from pending_signups).';
