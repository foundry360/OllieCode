-- Admin learner list: same columns as profiles used on the learners dashboard.
-- Service role only — not for anon/authenticated API clients.
-- (Auth login email is intentionally not included; use profiles.parent_email for approval contact.)
--
-- Ensure parent_email exists so this migration succeeds even if 20260425140000 was skipped
-- or migrations are applied out of order.

alter table public.profiles
  add column if not exists parent_email text;

create or replace view public.admin_learner_profiles as
select
  p.id,
  p.username,
  p.created_at,
  p.subscription_status,
  p.is_admin,
  p.avatar_slug,
  p.parent_email
from public.profiles p;

comment on view public.admin_learner_profiles is
  'Profile fields for admin dashboards (service_role select only).';

revoke all on public.admin_learner_profiles from anon;
revoke all on public.admin_learner_profiles from authenticated;
grant select on public.admin_learner_profiles to service_role;
