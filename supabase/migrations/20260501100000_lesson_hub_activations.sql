-- Track workspace opens with explicit ?lesson=<id> for published hub lessons (Popular on /learn).

create table if not exists public.lesson_hub_activations (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lesson_hub_activations_lesson_id_idx
  on public.lesson_hub_activations (lesson_id);

create index if not exists lesson_hub_activations_created_at_idx
  on public.lesson_hub_activations (created_at);

comment on table public.lesson_hub_activations is
  'One row per hub lesson workspace open (?lesson=); used to rank Popular lessons on /learn.';

alter table public.lesson_hub_activations enable row level security;

-- No policies on the table: reads/writes go through security definer RPCs below.

create or replace function public.record_lesson_hub_activation(p_lesson_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  if p_lesson_id is null then
    return;
  end if;
  v_id := trim(p_lesson_id);
  if length(v_id) = 0 or length(v_id) > 200 then
    return;
  end if;
  if v_id = 'none' or v_id = 'lvl1-paddle-vertical' then
    return;
  end if;
  if not exists (
    select 1
    from public.lms_lessons
    where id = v_id and published is true
  ) then
    return;
  end if;
  insert into public.lesson_hub_activations (lesson_id, user_id)
  values (v_id, auth.uid());
end;
$$;

comment on function public.record_lesson_hub_activation(text) is
  'Inserts one activation row when the lesson id is published; no-op otherwise.';

grant execute on function public.record_lesson_hub_activation(text) to anon, authenticated;

create or replace function public.lesson_hub_activation_counts()
returns table (lesson_id text, activation_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select a.lesson_id, count(*)::bigint as activation_count
  from public.lesson_hub_activations a
  group by a.lesson_id;
$$;

comment on function public.lesson_hub_activation_counts() is
  'Aggregate activation counts per lesson for hub ordering.';

grant execute on function public.lesson_hub_activation_counts() to anon, authenticated;
