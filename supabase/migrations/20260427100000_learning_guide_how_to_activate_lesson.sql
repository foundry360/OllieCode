/*
  Learning guide: how to open a lesson from the hub and launch it in the Workspace.
  Lists first (sort_order) so learners see it at the top of Learning Guides.
*/

update public.lms_learning_guides
set sort_order = 1
where id = 'parent-quick-start';

insert into public.lms_learning_guides (id, title, summary, card_image_url, body_html, published, sort_order)
values (
  'how-to-activate-a-lesson',
  'How to activate a lesson',
  'Go from the Learning Hub to the lesson page, then open the Workspace in one tap.',
  null,
  '<p>Use the <strong>Starter Lessons</strong> tab on the '
  || '<a href="/learn" rel="noopener noreferrer">Learning Hub</a>. This guide walks through turning a lesson card '
  || 'into an active build in the Workspace.</p>'
  || '<h2>1. Open the lesson page</h2>'
  || '<ol>'
  || '<li>Stay on (or switch to) <strong>Starter Lessons</strong>.</li>'
  || '<li>Scroll <strong>Popular lessons</strong> or use the list and filters below it.</li>'
  || '<li>Tap a lesson’s green <strong>title</strong> to open its overview page.</li>'
  || '</ol>'
  || '<h2>2. Activate the lesson</h2>'
  || '<p>On the lesson page, look for the green <strong>Activate lesson</strong> button in the card on the left. '
  || 'Tap it to jump into the Workspace with that lesson loaded so you can follow the steps and build along.</p>'
  || '<h2>3. If you see “Coming soon”</h2>'
  || '<p>Some lessons can be read on the hub but are not ready in the Workspace yet. Those show '
  || '<strong>Coming soon in the workspace</strong> instead of Activate lesson—you can still read the overview '
  || 'and check back later.</p>'
  || '<h2>Tip</h2>'
  || '<p>For more family-friendly context, open the <strong>Learning Guides</strong> tab and browse other short reads.</p>',
  true,
  0
)
on conflict (id) do nothing;
