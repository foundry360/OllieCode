/*
  Built-in learning guides: hub card images are uploaded in Admin → Guides (LMS assets).
  Clears `card_image_url` so nothing points at removed bundled `/public/images/learning-guide-card-*.png` files.
*/

update public.lms_learning_guides
set card_image_url = null
where id in (
  'parent-quick-start',
  'how-to-activate-a-lesson',
  'frequently-asked-questions'
);
