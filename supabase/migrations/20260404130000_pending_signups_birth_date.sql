alter table public.pending_signups
  add column if not exists birth_date date;

comment on column public.pending_signups.birth_date is 'Child date of birth from signup (8-digit MM/DD/YYYY entry).';
