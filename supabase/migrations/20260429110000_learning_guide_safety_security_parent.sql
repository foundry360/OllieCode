/*
  Learning Hub guide: parent-facing overview of safety, privacy, and trust on Ollie Code.
  Lives under Safety & Security; lists before “How to activate a lesson” in that section.
*/

update public.lms_learning_guides
set sort_order = 10
where id = 'how-to-activate-a-lesson';

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
  'safety-and-security-on-ollie-code',
  'Safety & Security on Ollie Code',
  'How Ollie Code keeps learning age-appropriate, ad-free, and privacy-minded—so parents can feel confident while kids explore.',
  null,
  $body$
<p>Helping your child learn to code should feel exciting—not uncertain. Ollie Code is designed to give kids a safe place to explore while giving parents confidence in how the platform works.</p>
<h2>A Safe Place to Learn and Create</h2>
<p>Ollie Code is built specifically for kids. Every part of the experience is designed to be age-appropriate, structured, and easy to navigate—so children can focus on creating instead of figuring out how to use the platform.</p>
<p>There are no open-ended social features, public sharing risks, or unmoderated interactions. It’s a contained environment where kids can safely experiment and learn.</p>
<h2>No Ads. No Distractions.</h2>
<p>Your child won’t encounter third-party ads, pop-ups, or unrelated content.</p>
<p>That means:</p>
<ul>
<li>No external links pulling them away</li>
<li>No targeted advertising</li>
<li>No interruptions during learning</li>
</ul>
<p>Just a focused space where time spent feels productive.</p>
<h2>Privacy Comes First</h2>
<p>We collect only what’s necessary to support your child’s experience.</p>
<ul>
<li>Personal information is limited and handled responsibly</li>
<li>Data is never sold or used for advertising</li>
<li>Accounts are designed with privacy in mind from the start</li>
</ul>
<p>Our goal is simple: support learning without compromising your child’s information.</p>
<h2>Secure Payments and Accounts</h2>
<p>All payments and account details are processed using secure, industry-standard systems.</p>
<ul>
<li>Encrypted transactions</li>
<li>Protected account information</li>
<li>Reliable payment handling</li>
</ul>
<p>You can manage your subscription with confidence, knowing your information is safeguarded.</p>
<h2>Designed for Independence—with Peace of Mind</h2>
<p>Ollie Code is built so kids can explore on their own, while parents stay confident in the environment.</p>
<ul>
<li>Clear structure reduces confusion</li>
<li>Guided experiences prevent frustration</li>
<li>Creative freedom happens within safe boundaries</li>
</ul>
<p>It’s a balance: kids feel independent, parents feel comfortable.</p>
<h2>What You Can Expect as a Parent</h2>
<ul>
<li>A platform built specifically for young learners</li>
<li>A safe, ad-free environment</li>
<li>Responsible data practices</li>
<li>A focus on real learning, not just screen time</li>
</ul>
<h2>Final Thought</h2>
<p>Ollie Code is designed to make coding feel creative, approachable, and safe—so your child can focus on what matters most: building, exploring, and growing their confidence.</p>
  $body$,
  true,
  0,
  'Safety & Security'
)
on conflict (id) do nothing;
