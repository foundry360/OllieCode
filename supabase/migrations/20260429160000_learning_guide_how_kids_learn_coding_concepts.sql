/*
  Learning Hub guide: how kids learn core coding concepts in Ollie (parent-friendly).
  Lists first in Coding Blocks; moves the long workspace reference below it.
*/

update public.lms_learning_guides
set sort_order = 10
where id = 'workspace-blocks-reference';

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
  'how-kids-learn-coding-concepts',
  'How Kids Learn Coding Concepts in Ollie Code',
  'Scripts, sockets, variables, and broadcasts—explained in plain language for families, without jargon overload.',
  null,
  $body$
<p>Ollie Code introduces real coding concepts in a way that feels natural and approachable. Instead of overwhelming kids with terminology, ideas are learned through building, experimenting, and seeing what happens.</p>
<p>Below is a simple guide to the core concepts your child will encounter—and how to understand them without needing a technical background.</p>
<h2>How scripts run</h2>
<h3>How actions come to life</h3>
<p>In Ollie Code, programs are built by snapping blocks together into &quot;scripts.&quot;</p>
<ul>
<li>Scripts run from top to bottom, one step at a time</li>
<li>A starting block (often called a &quot;hat&quot;) tells the program when to begin</li>
<li>Pressing <strong>Run</strong> triggers those instructions</li>
</ul>
<p>Kids also learn that:</p>
<ul>
<li>One character (or &quot;sprite&quot;) can have its own script</li>
<li>Multiple sprites can run scripts at the same time</li>
</ul>
<p>This helps them understand how actions are triggered and how different parts of a program work together.</p>
<h2>Values and &quot;holes&quot;</h2>
<h3>What blocks can hold and how they fit together</h3>
<p>Some blocks have spaces (or &quot;sockets&quot;) where other blocks fit inside.</p>
<p>These spaces expect specific types of values:</p>
<ul>
<li>Numbers (like scores or positions)</li>
<li>Text (like messages)</li>
<li>Yes/No decisions (true/false logic)</li>
<li>Colors or other inputs</li>
</ul>
<p>Blocks are shaped differently on purpose—only the right type fits in the right place.</p>
<p>As kids experiment, they begin to understand:</p>
<ul>
<li>How to combine blocks (nesting)</li>
<li>Why some combinations work and others do not</li>
</ul>
<p>This builds an intuitive sense of how logic and structure work in programming.</p>
<h2>Variables (explained simply)</h2>
<h3>Storing and updating information</h3>
<p>A variable is just a named place to store something.</p>
<p>Kids use variables to keep track of things like:</p>
<ul>
<li>Score</li>
<li>Lives</li>
<li>Time</li>
</ul>
<p>They learn to:</p>
<ul>
<li>Give variables clear, simple names</li>
<li>Update values using actions like &quot;change by&quot;</li>
</ul>
<p>Instead of memorizing rules, they see variables in action—how values change as their game or project runs.</p>
<h2>Broadcasts and coordination</h2>
<h3>How different parts talk to each other</h3>
<p>As projects grow, kids need different elements to work together.</p>
<p>Broadcasts act like messages between sprites:</p>
<ul>
<li>One sprite sends a message</li>
<li>Others respond when they receive it</li>
</ul>
<p>There are two common patterns:</p>
<ul>
<li><strong>Broadcast</strong> → sends a message and continues immediately</li>
<li><strong>Broadcast and wait</strong> → pauses until other actions finish</li>
</ul>
<p>This helps kids build simple game flows, like:</p>
<ul>
<li>Starting a game</li>
<li>Switching levels</li>
<li>Triggering events</li>
</ul>
<p>They begin to understand how systems coordinate—not just individual actions.</p>
<h2>What this means for your child</h2>
<p>These concepts may sound technical, but in Ollie Code they are learned through doing—not memorizing.</p>
<p>As your child builds:</p>
<ul>
<li>They learn how actions connect</li>
<li>They experiment and adjust</li>
<li>They begin to think in systems, not just steps</li>
</ul>
<h2>Final thought</h2>
<p>Ollie Code keeps concepts simple and visual, so kids can focus on creating. Over time, these building blocks turn into real understanding—without ever feeling overwhelming.</p>
  $body$,
  true,
  0,
  'Coding Blocks'
)
on conflict (id) do nothing;
