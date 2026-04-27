/*
  Learning Hub: HTML learning guides (separate from interactive lessons).
  RLS mirrors lms_lessons: public read when published; admins see all; writes admin-only.
*/

create table if not exists public.lms_learning_guides (
  id text primary key,
  title text not null,
  summary text not null default '',
  card_image_url text,
  body_html text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lms_learning_guides is 'HTML guides shown on the Learning Hub; body is sanitized in the app before render.';

create index if not exists lms_learning_guides_published_idx
  on public.lms_learning_guides (published)
  where published = true;

create index if not exists lms_learning_guides_sort_idx
  on public.lms_learning_guides (sort_order, title);

create or replace function public.set_lms_learning_guides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lms_learning_guides_set_updated_at on public.lms_learning_guides;
create trigger lms_learning_guides_set_updated_at
  before update on public.lms_learning_guides
  for each row execute procedure public.set_lms_learning_guides_updated_at();

alter table public.lms_learning_guides enable row level security;

drop policy if exists "lms_learning_guides_select" on public.lms_learning_guides;
drop policy if exists "lms_learning_guides_insert" on public.lms_learning_guides;
drop policy if exists "lms_learning_guides_update" on public.lms_learning_guides;
drop policy if exists "lms_learning_guides_delete" on public.lms_learning_guides;

create policy "lms_learning_guides_select"
  on public.lms_learning_guides for select
  to anon, authenticated
  using (
    published = true
    or public.is_platform_admin()
  );

create policy "lms_learning_guides_insert"
  on public.lms_learning_guides for insert
  to authenticated
  with check (public.is_platform_admin());

create policy "lms_learning_guides_update"
  on public.lms_learning_guides for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "lms_learning_guides_delete"
  on public.lms_learning_guides for delete
  to authenticated
  using (public.is_platform_admin());

grant select on public.lms_learning_guides to anon, authenticated;
grant insert, update, delete on public.lms_learning_guides to authenticated;

insert into public.lms_learning_guides (id, title, summary, card_image_url, body_html, published, sort_order)
values (
  'parent-quick-start',
  'Parent quick start',
  'How accounts work, where to find the Learning Hub, and how to support your child without hovering over every keystroke.',
  null,
  '<p>Welcome! This short guide covers the basics for parents and caregivers.</p>'
  || '<h2>Accounts</h2>'
  || '<p>Each learner can sign in with their own account. Parents receive approval emails when younger learners need consent.</p>'
  || '<h2>Learning Hub</h2>'
  || '<p>Use the Learning Hub to browse lessons and guides. Open a lesson when it is marked available in the workspace.</p>'
  || '<h2>Cheering them on</h2>'
  || '<p>Celebrate finished steps and experiments—even small ones. Curiosity grows when mistakes are part of the fun.</p>',
  true,
  0
)
on conflict (id) do nothing;
