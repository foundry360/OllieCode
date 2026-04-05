/*
  Allow learners to remove a mission row when deleting a mission from the app.
*/

drop policy if exists "saved_mission_progress_delete_own" on public.saved_mission_progress;

create policy "saved_mission_progress_delete_own"
  on public.saved_mission_progress for delete to authenticated
  using (user_id = (select auth.uid()));

grant delete on public.saved_mission_progress to authenticated;
