/*
  Fix recursive RLS on public.profiles updates.

  A prior migration changed the update policy to query public.profiles inside
  the policy itself when checking is_admin, which can trigger:
  "infinite recursion detected in policy for relation profiles".

  Restore the simple own-row update policy and protect is_admin from
  self-escalation with a trigger instead.
*/

create or replace function public.preserve_profiles_is_admin()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.id = auth.uid() then
    new.is_admin = old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_preserve_is_admin on public.profiles;
create trigger profiles_preserve_is_admin
  before update on public.profiles
  for each row execute procedure public.preserve_profiles_is_admin();

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
