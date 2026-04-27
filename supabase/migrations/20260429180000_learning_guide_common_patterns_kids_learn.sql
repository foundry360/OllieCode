/*
  Learning Hub guide: reusable patterns (loops, clones, lists) for kids in Ollie Code.
  Coding Blocks section; sort between skills (5) and workspace reference (10).
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
  'common-patterns-kids-learn',
  'Common Patterns Kids Learn',
  'Loops in games, clones, and lists—simple recipes kids reuse as they go from experimenting to building with intention.',
  null,
  $body$
<p>As kids gain experience, they start recognizing patterns—simple &quot;recipes&quot; they can reuse in different projects. These patterns help them build faster and think more confidently.</p>
<h2>Loops in games</h2>
<h3>Repeating actions with purpose</h3>
<p>Loops let actions happen more than once.</p>
<p>Kids learn:</p>
<ul>
<li><strong>Repeat</strong> → do something a set number of times</li>
<li><strong>Forever</strong> → keep something running continuously</li>
</ul>
<p>They also explore:</p>
<ul>
<li>When to use &quot;wait until&quot; (pause until something happens)</li>
<li>How to stop or change a loop when conditions are met</li>
</ul>
<p>In simple terms, they begin to understand:</p>
<ul>
<li>When something should keep going</li>
<li>When it should stop or change</li>
</ul>
<h2>Clones</h2>
<h3>Creating more without rebuilding</h3>
<p>Clones allow kids to make copies of a character automatically.</p>
<p>They learn patterns like:</p>
<ul>
<li>One starting point for clones</li>
<li>Creating and removing clones as needed</li>
<li>Checking: &quot;Is this the original or a clone?&quot;</li>
</ul>
<p>This is often used for:</p>
<ul>
<li>Enemies in a game</li>
<li>Falling objects</li>
<li>Repeating challenges</li>
</ul>
<p>It introduces the idea of scaling—doing more without starting from scratch.</p>
<h2>Lists and tables</h2>
<h3>Organizing information</h3>
<p>Lists help store multiple pieces of information in one place.</p>
<p>Kids might use lists for:</p>
<ul>
<li>High scores</li>
<li>A set of questions</li>
<li>Tracking items or progress</li>
</ul>
<p>Instead of handling one value at a time, they learn how to:</p>
<ul>
<li>Store and update groups of information</li>
<li>Work with sequences of data</li>
</ul>
<h2>What this means for your child</h2>
<p>Patterns help kids move from experimenting to building with intention.</p>
<p>They start to:</p>
<ul>
<li>Recognize solutions they have used before</li>
<li>Apply ideas across different projects</li>
<li>Build more complex creations with confidence</li>
</ul>
<h2>Final thought</h2>
<p>These patterns become shortcuts for thinking—helping kids create more while doing less from scratch.</p>
  $body$,
  true,
  7,
  'Coding Blocks'
)
on conflict (id) do nothing;
