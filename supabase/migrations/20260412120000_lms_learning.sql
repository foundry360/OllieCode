/*
  LMS: lesson completion points, badges, and catalog-aligned progress.
  Apply: Supabase Dashboard → SQL Editor → paste → Run
*/

-- Lesson completions (lesson_id matches app catalog in src/lib/lms/lessonsCatalog.ts)
create table if not exists public.user_lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  points_earned integer not null default 0 check (points_earned >= 0),
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

comment on table public.user_lesson_completions is 'Finished lessons; points roll up to profile totals.';

create index if not exists user_lesson_completions_user_id_idx
  on public.user_lesson_completions (user_id);

alter table public.user_lesson_completions enable row level security;

drop policy if exists "user_lesson_completions_select_own" on public.user_lesson_completions;
drop policy if exists "user_lesson_completions_insert_own" on public.user_lesson_completions;
drop policy if exists "user_lesson_completions_update_own" on public.user_lesson_completions;

create policy "user_lesson_completions_select_own"
  on public.user_lesson_completions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_lesson_completions_insert_own"
  on public.user_lesson_completions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_lesson_completions_update_own"
  on public.user_lesson_completions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.user_lesson_completions to authenticated;

-- Badges (seeded; awarded by app or SQL later)
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon_emoji text not null default '🏅',
  skill_level integer not null default 1 check (skill_level >= 1),
  created_at timestamptz not null default now()
);

comment on table public.badges is 'Achievements learners can earn; referenced by user_badges.';

alter table public.badges enable row level security;

drop policy if exists "badges_select_authenticated" on public.badges;

create policy "badges_select_authenticated"
  on public.badges for select to authenticated
  using (true);

grant select on public.badges to authenticated;

insert into public.badges (slug, title, description, icon_emoji, skill_level)
values
  ('first-steps', 'First steps', 'Complete your first Level 1 lesson.', '🌱', 1),
  ('pathfinder', 'Pathfinder', 'Finish the Robot path adventure.', '🤖', 1)
on conflict (slug) do nothing;

create table if not exists public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

comment on table public.user_badges is 'Badges earned by each account.';

create index if not exists user_badges_user_id_idx on public.user_badges (user_id);

alter table public.user_badges enable row level security;

drop policy if exists "user_badges_select_own" on public.user_badges;
drop policy if exists "user_badges_insert_own" on public.user_badges;

create policy "user_badges_select_own"
  on public.user_badges for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_badges_insert_own"
  on public.user_badges for insert to authenticated
  with check (user_id = (select auth.uid()));

grant select, insert on public.user_badges to authenticated;
