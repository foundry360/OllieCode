/*
  Admin portal: platform admins + published lesson rows (JSON payload).
  Set your account: update public.profiles set is_admin = true where id = '<your-auth-user-id>';
*/

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is 'When true, user may access /admin and manage lms_lessons.';

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and is_admin = (select p.is_admin from public.profiles p where p.id = (select auth.uid()))
  );

create table if not exists public.lms_lessons (
  id text primary key,
  payload jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lms_lessons is 'Lesson catalog overrides; payload mirrors LessonCatalogEntry JSON.';

create index if not exists lms_lessons_published_idx
  on public.lms_lessons (published)
  where published = true;

create or replace function public.set_lms_lessons_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lms_lessons_set_updated_at on public.lms_lessons;
create trigger lms_lessons_set_updated_at
  before update on public.lms_lessons
  for each row execute procedure public.set_lms_lessons_updated_at();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

alter table public.lms_lessons enable row level security;

drop policy if exists "lms_lessons_select" on public.lms_lessons;
drop policy if exists "lms_lessons_insert" on public.lms_lessons;
drop policy if exists "lms_lessons_update" on public.lms_lessons;
drop policy if exists "lms_lessons_delete" on public.lms_lessons;

create policy "lms_lessons_select"
  on public.lms_lessons for select
  to anon, authenticated
  using (
    published = true
    or public.is_platform_admin()
  );

create policy "lms_lessons_insert"
  on public.lms_lessons for insert
  to authenticated
  with check (public.is_platform_admin());

create policy "lms_lessons_update"
  on public.lms_lessons for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "lms_lessons_delete"
  on public.lms_lessons for delete
  to authenticated
  using (public.is_platform_admin());

grant select on public.lms_lessons to anon, authenticated;
grant insert, update, delete on public.lms_lessons to authenticated;
