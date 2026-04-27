/*
  Learning Hub guide: same Q&A copy as the landing FAQ section (FaqSection.tsx).
  Requires lms_learning_guides + section column (earlier migrations).
*/

insert into public.lms_learning_guides (
  id,
  title,
  summary,
  card_image_url,
  body_html,
  published,
  sort_order,
  section
)
values (
  'frequently-asked-questions',
  'Frequently asked questions',
  'Quick answers about ages, devices, accounts, curriculum, and getting help.',
  null,
  $faq$
<p>Quick answers for families and educators. Open each topic below for details.</p>
<h2>What ages is Ollie Code for?</h2>
<p>Ollie Code is built for kids about 7–13. Younger learners can explore with a grown-up nearby; older tweens still enjoy the block-based workspace while leveling up their logic skills.</p>
<h2>Does my child need to know how to type?</h2>
<p>No. Projects use drag-and-drop blocks, so kids focus on ideas and sequencing instead of spelling or syntax. Typing can come later when they are ready.</p>
<h2>What device or browser do we need?</h2>
<p>A recent version of Chrome, Edge, Firefox, or Safari on a laptop, Chromebook, or desktop works best. A mouse or trackpad helps on the canvas; tablets can work but a larger screen is nicer for the block palette.</p>
<h2>How do accounts and sign-in work?</h2>
<p>Families or schools create an account so progress and projects can be saved. Your organization’s flow (for example, parent approval) may vary — follow the prompts on sign up.</p>
<h2>Is there a structured curriculum?</h2>
<p>Yes. Learners can follow guided lessons and adventures while still experimenting freely in the workspace. Staff and teachers can publish or assign content depending on your program setup.</p>
<h2>Where can we get help?</h2>
<p>Use the “Have a question?” button on this site to send us a note, or reach out through your school or program contact if you are joining through an organization.</p>
  $faq$,
  true,
  20,
  'Ollie Code Basics'
)
on conflict (id) do nothing;
