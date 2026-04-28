/*
  Per-account scene library for “My Scenes” — independent of adventures.
  Images live in Storage `projects` under `{user_id}/user-scenes/{uuid}.png`.

  Apply: Supabase Dashboard → SQL Editor → paste → Run
*/

create table if not exists public.user_scenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

comment on table public.user_scenes is 'User-uploaded backdrop images; survives mission deletion.';

create index if not exists user_scenes_user_id_created_at_idx
  on public.user_scenes (user_id, created_at desc);

alter table public.user_scenes enable row level security;

drop policy if exists "user_scenes_select_own" on public.user_scenes;
drop policy if exists "user_scenes_insert_own" on public.user_scenes;
drop policy if exists "user_scenes_update_own" on public.user_scenes;
drop policy if exists "user_scenes_delete_own" on public.user_scenes;

create policy "user_scenes_select_own"
  on public.user_scenes for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_scenes_insert_own"
  on public.user_scenes for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_scenes_update_own"
  on public.user_scenes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_scenes_delete_own"
  on public.user_scenes for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.user_scenes to authenticated;

/** Allow PNG backdrops under `projects` (`user-scenes/`, `painted-costumes/`). */
update storage.buckets
set allowed_mime_types = array['application/json', 'text/plain', 'image/png']::text[]
where id = 'projects';
