/*
  Ensure the REST API can read/write mission rows for logged-in users.
  Run in SQL Editor if you already applied 20260405130000 without these grants.
*/

grant select, insert, update on public.saved_mission_progress to authenticated;
