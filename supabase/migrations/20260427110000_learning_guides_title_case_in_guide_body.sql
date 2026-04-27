/*
  Title-case "Learning Guides" in seeded guide body (environments that already ran 20260427100000).
*/

update public.lms_learning_guides
set body_html = replace(
  body_html,
  '<strong>Learning guides</strong>',
  '<strong>Learning Guides</strong>'
)
where id = 'how-to-activate-a-lesson'
  and body_html like '%<strong>Learning guides</strong>%';

update public.lms_learning_guides
set body_html = replace(
  body_html,
  '<p>Starter lessons live under the <strong>Starter Lessons</strong> tab on the ',
  '<p>Use the <strong>Starter Lessons</strong> tab on the '
)
where id = 'how-to-activate-a-lesson'
  and body_html like '%Starter lessons live under%';
