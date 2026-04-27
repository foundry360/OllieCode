/*
  Learning Hub guide: how Ollie blocks map to real programming ideas (parent-friendly).
  Coding Blocks section; sort between common patterns (7) and workspace reference (10).
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
  'from-blocks-to-real-coding',
  'From Blocks to Real Coding',
  'Visual blocks teach sequences, logic, and events—the same foundations as typed code, so syntax is the only new piece later.',
  null,
  $body$
<p>Ollie Code uses visual blocks, but the ideas behind them are the same ones used in real programming.</p>
<h2>What blocks are teaching</h2>
<h3>The foundations behind the fun</h3>
<p>As kids build with blocks, they are learning:</p>
<ul>
<li><strong>Sequences</strong> — steps that run in order</li>
<li><strong>Logic</strong> — decisions like yes/no conditions</li>
<li><strong>Events</strong> — actions that start when something happens</li>
</ul>
<p>These are the same building blocks used in every programming language.</p>
<h2>How this connects to the future</h2>
<h3>Preparing for typed code—without rushing it</h3>
<p>When kids eventually move to text-based coding, the concepts will already feel familiar.</p>
<p>Instead of learning everything at once, they will already understand:</p>
<ul>
<li>How programs flow</li>
<li>How decisions are made</li>
<li>How different parts work together</li>
</ul>
<p>The only new piece becomes syntax (how it is written)—not how it works.</p>
<h2>Why this matters</h2>
<p>Starting with blocks removes early frustration and builds confidence first.</p>
<p>Kids do not just learn how to code—they learn:</p>
<ul>
<li>How to think through problems</li>
<li>How to structure ideas</li>
<li>How to build something step by step</li>
</ul>
<h2>Final thought</h2>
<p>Blocks are not a shortcut—they are a foundation. They help kids understand coding deeply before ever needing to type it.</p>
  $body$,
  true,
  8,
  'Coding Blocks'
)
on conflict (id) do nothing;
