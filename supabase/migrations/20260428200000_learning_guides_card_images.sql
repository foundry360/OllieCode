/*
  Learning Hub guide cards: `card_image_url` may point at static files or LMS uploads.
  Superseded for built-in guides by `20260429100000_learning_guides_clear_builtin_card_urls.sql`
  (card art is managed in Admin → Guides).
*/

update public.lms_learning_guides
set card_image_url = '/images/learning-guide-card-parent-quick-start.png'
where id = 'parent-quick-start';

update public.lms_learning_guides
set card_image_url = '/images/learning-guide-card-how-to-activate-a-lesson.png'
where id = 'how-to-activate-a-lesson';

update public.lms_learning_guides
set card_image_url = '/images/learning-guide-card-frequently-asked-questions.png'
where id = 'frequently-asked-questions';
