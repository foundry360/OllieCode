/*
  Per-account sprite library for “My Sprites” — independent of adventures.
  Deleting an adventure does not remove rows here (no FK to missions).

  Apply: Supabase Dashboard → SQL Editor → paste → Run
*/

create table if not exists public.user_sprites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  display_name text not null,
  source text not null check (source in ('paint', 'upload')),
  created_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

comment on table public.user_sprites is 'User-created sprite images (paint/upload); survives mission deletion.';

create index if not exists user_sprites_user_id_created_at_idx
  on public.user_sprites (user_id, created_at desc);

alter table public.user_sprites enable row level security;

drop policy if exists "user_sprites_select_own" on public.user_sprites;
drop policy if exists "user_sprites_insert_own" on public.user_sprites;
drop policy if exists "user_sprites_update_own" on public.user_sprites;
drop policy if exists "user_sprites_delete_own" on public.user_sprites;

create policy "user_sprites_select_own"
  on public.user_sprites for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_sprites_insert_own"
  on public.user_sprites for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_sprites_update_own"
  on public.user_sprites for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_sprites_delete_own"
  on public.user_sprites for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.user_sprites to authenticated;
