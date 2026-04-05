/*
  Named mission saves per user (mirrors SavedMissionProgressEntry in the app).
  Apply: Supabase Dashboard → SQL Editor → paste → Run
*/

create table if not exists public.saved_mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_id text not null,
  display_name text not null,
  saved_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

comment on table public.saved_mission_progress is 'Latest named save per mission per account; synced with project JSON on load/save.';

create index if not exists saved_mission_progress_user_id_idx
  on public.saved_mission_progress (user_id);

alter table public.saved_mission_progress enable row level security;

drop policy if exists "saved_mission_progress_select_own" on public.saved_mission_progress;
drop policy if exists "saved_mission_progress_insert_own" on public.saved_mission_progress;
drop policy if exists "saved_mission_progress_update_own" on public.saved_mission_progress;

create policy "saved_mission_progress_select_own"
  on public.saved_mission_progress for select to authenticated
  using (user_id = (select auth.uid()));

create policy "saved_mission_progress_insert_own"
  on public.saved_mission_progress for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "saved_mission_progress_update_own"
  on public.saved_mission_progress for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.saved_mission_progress to authenticated;
