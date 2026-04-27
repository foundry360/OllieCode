/*
  Rename Learning Hub guide section "Blocks" → "Coding Blocks" (matches app constant).
*/

update public.lms_learning_guides
set section = 'Coding Blocks'
where section = 'Blocks';
