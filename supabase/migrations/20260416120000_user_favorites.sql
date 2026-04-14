/*
  User favorites: lessons (catalog ids) and workspace missions.
  Apply: Supabase Dashboard → SQL Editor → paste → Run
*/

create table if not exists public.user_favorite_lessons (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

comment on table public.user_favorite_lessons is 'Hub lessons the learner marked as favorites.';

create index if not exists user_favorite_lessons_user_id_idx
  on public.user_favorite_lessons (user_id);

alter table public.user_favorite_lessons enable row level security;

drop policy if exists "user_favorite_lessons_select_own" on public.user_favorite_lessons;
drop policy if exists "user_favorite_lessons_insert_own" on public.user_favorite_lessons;
drop policy if exists "user_favorite_lessons_delete_own" on public.user_favorite_lessons;

create policy "user_favorite_lessons_select_own"
  on public.user_favorite_lessons for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_favorite_lessons_insert_own"
  on public.user_favorite_lessons for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_favorite_lessons_delete_own"
  on public.user_favorite_lessons for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.user_favorite_lessons to authenticated;

create table if not exists public.user_favorite_missions (
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

comment on table public.user_favorite_missions is 'Workspace missions/adventures marked as favorites.';

create index if not exists user_favorite_missions_user_id_idx
  on public.user_favorite_missions (user_id);

alter table public.user_favorite_missions enable row level security;

drop policy if exists "user_favorite_missions_select_own" on public.user_favorite_missions;
drop policy if exists "user_favorite_missions_insert_own" on public.user_favorite_missions;
drop policy if exists "user_favorite_missions_delete_own" on public.user_favorite_missions;

create policy "user_favorite_missions_select_own"
  on public.user_favorite_missions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_favorite_missions_insert_own"
  on public.user_favorite_missions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_favorite_missions_delete_own"
  on public.user_favorite_missions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.user_favorite_missions to authenticated;
