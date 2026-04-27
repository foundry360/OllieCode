/*
  Learning Hub: group guides under section headers (e.g. Ollie Code Basics, Safety & Security).
*/

alter table public.lms_learning_guides
  add column if not exists section text not null default 'Ollie Code Basics';

comment on column public.lms_learning_guides.section is 'Hub Guides tab: section heading this guide appears under.';

create index if not exists lms_learning_guides_section_sort_idx
  on public.lms_learning_guides (section, sort_order, title);

-- Seed alignment: lesson-activation guide fits “Safety & Security”; parent intro stays Basics.
update public.lms_learning_guides
set section = 'Safety & Security'
where id = 'how-to-activate-a-lesson';
