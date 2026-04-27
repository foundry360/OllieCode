/*
  Messages from the public “Message us” / contact form — admins read in /admin/messages.
  Inserts use the service role from /api/contact (RLS bypass). Authenticated platform admins select/update.
*/

create table if not exists public.contact_inbox_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_name text not null,
  visitor_email text not null,
  message text not null,
  read_at timestamptz null,
  auth_user_id uuid null
);

comment on table public.contact_inbox_messages is 'Contact form submissions for the admin inbox; inserted by API (service role).';
comment on column public.contact_inbox_messages.read_at is 'When a platform admin opened the message in the admin portal.';
comment on column public.contact_inbox_messages.auth_user_id is 'Signed-in submitter, if any; null for anonymous/guest form.';

create index if not exists contact_inbox_messages_created_at_idx
  on public.contact_inbox_messages (created_at desc);

create index if not exists contact_inbox_messages_unread_idx
  on public.contact_inbox_messages (created_at desc)
  where read_at is null;

alter table public.contact_inbox_messages enable row level security;

drop policy if exists "contact_inbox_messages_select_admin" on public.contact_inbox_messages;
drop policy if exists "contact_inbox_messages_update_admin" on public.contact_inbox_messages;

create policy "contact_inbox_messages_select_admin"
  on public.contact_inbox_messages for select
  to authenticated
  using (public.is_platform_admin());

create policy "contact_inbox_messages_update_admin"
  on public.contact_inbox_messages for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, update on public.contact_inbox_messages to authenticated;
