-- Family plan: master (first subscriber) + up to 3 seats (master + siblings).
-- `family_group_members` links each member to their billing master.
-- `profiles.billing_master_user_id` is set for non-master members for fast client checks.

create table if not exists public.family_group_members (
  master_user_id uuid not null references public.profiles (id) on delete cascade,
  member_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (master_user_id, member_user_id)
);

comment on table public.family_group_members is
  'Family plan roster: master_user_id owns Stripe subscription; member_user_id includes master (self-row) and siblings.';

create index if not exists family_group_members_member_idx
  on public.family_group_members (member_user_id);

alter table public.profiles
  add column if not exists billing_master_user_id uuid references public.profiles (id) on delete set null;

comment on column public.profiles.billing_master_user_id is
  'When set, this learner''s paid access follows the Family subscription on the master profile (master keeps NULL here).';

alter table public.family_group_members enable row level security;

drop policy if exists "family_group_members_select" on public.family_group_members;
create policy "family_group_members_select"
  on public.family_group_members for select to authenticated
  using (master_user_id = (select auth.uid()) or member_user_id = (select auth.uid()));

drop policy if exists "family_group_members_insert" on public.family_group_members;
create policy "family_group_members_insert"
  on public.family_group_members for insert to authenticated
  with check (master_user_id = (select auth.uid()));

drop policy if exists "family_group_members_delete_master" on public.family_group_members;
create policy "family_group_members_delete_master"
  on public.family_group_members for delete to authenticated
  using (master_user_id = (select auth.uid()));

drop policy if exists "family_group_members_delete_self" on public.family_group_members;
create policy "family_group_members_delete_self"
  on public.family_group_members for delete to authenticated
  using (
    member_user_id = (select auth.uid())
    and master_user_id <> (select auth.uid())
  );

-- Members may read the master profile row (subscription_status, Stripe ids) for shared billing UX.
drop policy if exists "profiles_select_family_master" on public.profiles;
create policy "profiles_select_family_master"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.family_group_members f
      where f.master_user_id = profiles.id
        and f.member_user_id = (select auth.uid())
        and f.master_user_id <> f.member_user_id
    )
  );
