/*
  One-off maintenance (do not add to automated migrations).

  Sets public.profiles.username for a user identified by auth email. The workspace
  header shows profiles.username when set; otherwise it falls back to the email
  local part.

  1. Uncomment the three statements below.
  2. Replace YOUR_EMAIL_HERE and YOUR_NEW_USERNAME.
  3. Run in Supabase Dashboard → SQL Editor (postgres role; bypasses RLS).

  If the update fails with a unique violation, another profile already uses that
  username — change or clear it first.
*/

-- select p.id, u.email, p.username as current_username
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- where lower(u.email) = lower('YOUR_EMAIL_HERE');

-- update public.profiles p
-- set username = 'YOUR_NEW_USERNAME'
-- from auth.users u
-- where p.id = u.id
--   and lower(u.email) = lower('YOUR_EMAIL_HERE');

-- select p.id, u.email, p.username
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- where lower(u.email) = lower('YOUR_EMAIL_HERE');
