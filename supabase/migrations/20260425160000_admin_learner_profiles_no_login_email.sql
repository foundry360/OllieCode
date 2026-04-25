-- Remove auth.users.email from admin_learner_profiles (learners table shows approval email only).

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
