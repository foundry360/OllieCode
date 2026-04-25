-- Fix last_sign_in_at always null: PG15+ defaults views to security_invoker=true; PostgREST then
-- cannot read auth.users under the invoker. Rebuild as security definer (security_invoker=false).
--
-- DROP required when replacing an older view shape (e.g. auth_email column); CREATE OR REPLACE cannot
-- rename view columns (42P16).

drop view if exists public.admin_learner_profiles;

create view public.admin_learner_profiles
with (security_invoker = false)
as
select
  p.id,
  p.username,
  p.created_at,
  p.subscription_status,
  p.is_admin,
  p.avatar_slug,
  p.parent_email,
  u.last_sign_in_at
from public.profiles p
left join auth.users u on u.id = p.id;

comment on view public.admin_learner_profiles is
  'Profiles plus auth last_sign_in_at for admin dashboards (service_role select only).';

revoke all on public.admin_learner_profiles from anon;
revoke all on public.admin_learner_profiles from authenticated;
grant select on public.admin_learner_profiles to service_role;
