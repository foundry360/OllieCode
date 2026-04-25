-- Expose auth.users.last_sign_in_at for admin learner list (not available on profiles alone).
-- security_invoker=false: PostgREST uses session role authenticator; invoker=true cannot read auth.users.
-- Owner (postgres) runs the join; only service_role has SELECT on this view.
--
-- DROP first: older admin_learner_profiles shapes (e.g. auth_email) cannot be replaced by OR REPLACE
-- when the last column name changes (PostgreSQL 42P16).

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
