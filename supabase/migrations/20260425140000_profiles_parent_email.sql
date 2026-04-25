-- Parent/guardian contact for admin and support (child signups, family siblings).

alter table public.profiles
  add column if not exists parent_email text;

comment on column public.profiles.parent_email is
  'Parent or guardian email when known (e.g. child signup approval, family master for siblings).';
