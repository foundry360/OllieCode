-- Links a saved adventure to a Learning Hub lesson when the learner activated from the hub.

alter table public.saved_mission_progress
  add column if not exists hub_lesson_id text null;

comment on column public.saved_mission_progress.hub_lesson_id is
  'Learning Hub lesson id when progress was saved from an activated lesson; null for freeform adventures.';
