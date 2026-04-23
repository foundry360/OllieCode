-- One-off: create missing public.profiles rows for existing auth.users (same as trigger + migration backfill).
-- Run in Supabase SQL Editor if some users appear under Authentication but not in public.profiles.

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
