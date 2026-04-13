/*
  Public read bucket for Learning Hub lesson card + thumbnail images (admin upload only).
  Requires public.is_platform_admin() from 20260413100000_admin_lms_lessons.sql

  Apply this migration (or the project will return "Bucket not found" on lesson image upload):
  - Linked CLI: `supabase db push`
  - Or Supabase Dashboard → SQL → paste this file → Run
*/

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lms-assets',
  'lms-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lms_assets_select_public" on storage.objects;
drop policy if exists "lms_assets_insert_admin" on storage.objects;

create policy "lms_assets_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'lms-assets');

create policy "lms_assets_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lms-assets'
    and public.is_platform_admin()
  );
