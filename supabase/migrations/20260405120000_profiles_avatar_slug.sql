alter table public.profiles
  add column if not exists avatar_slug text;

comment on column public.profiles.avatar_slug is 'Basename (no extension) of image under /images/avatars, e.g. Racecar.';
