/*
  Storage only — private bucket `projects` + RLS for paths `{userId}/{projectId}.json`

  Skip this file if you already created the bucket and policies in the Supabase dashboard.
  Otherwise: SQL Editor → paste → Run.

  If you only need the `profiles` table, run `20260403120001_ollie_profiles.sql` instead.
*/

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'projects',
  'projects',
  false,
  5242880,
  array['application/json', 'text/plain']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "projects_select_own" on storage.objects;
drop policy if exists "projects_insert_own" on storage.objects;
drop policy if exists "projects_update_own" on storage.objects;
drop policy if exists "projects_delete_own" on storage.objects;

create policy "projects_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'projects'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "projects_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'projects'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "projects_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'projects'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'projects'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "projects_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'projects'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
