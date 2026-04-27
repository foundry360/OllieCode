/*
  Learning Hub guide: problem-solving skills kids develop while building in Ollie Code.
  Coding Blocks section, between concepts (0) and workspace reference (10).
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
  'skills-kids-build-while-creating',
  'Skills Kids Build While Creating',
  'Debugging, motion on the stage, and pairing looks with sound—skills that grow naturally as kids build and revise their projects.',
  null,
  $body$
<p>As kids work on projects in Ollie Code, they are not just learning concepts—they are developing real problem-solving skills. These show up naturally as they build, test, and improve their ideas.</p>
<h2>Debugging with blocks</h2>
<h3>Figuring out what went wrong</h3>
<p>When something does not work, kids learn to investigate—not give up.</p>
<p>They begin to:</p>
<ul>
<li>Change one thing at a time to see what affects the outcome</li>
<li>Use simple tools like &quot;wait&quot; or &quot;say&quot; blocks to trace what is happening</li>
<li>Recognize common issues, like:
<ul>
<li>The wrong starting block</li>
<li>A loop that never stops</li>
<li>An empty or incorrect condition</li>
</ul>
</li>
</ul>
<p>Debugging becomes a process of exploration and adjustment, not failure.</p>
<h2>Motion and the stage</h2>
<h3>Understanding how things move</h3>
<p>Kids learn how objects move and interact on a visual stage.</p>
<p>They explore:</p>
<ul>
<li>Position using simple coordinates (like left/right, up/down ranges)</li>
<li>How characters react at edges (like bouncing)</li>
<li>The difference between:
<ul>
<li>Gliding (smooth movement)</li>
<li>Teleporting (instant movement)</li>
</ul>
</li>
<li>Direction—where something is pointing vs where it moves</li>
</ul>
<p>This builds spatial awareness and control over how things behave on screen.</p>
<h2>Looks and sound together</h2>
<h3>Bringing projects to life</h3>
<p>Visuals and sound turn simple projects into engaging experiences.</p>
<p>Kids learn to:</p>
<ul>
<li>Switch between costumes (how a character looks) and scenes (the background)</li>
<li>Time speech or actions using wait blocks</li>
<li>Layer sounds to match what is happening</li>
</ul>
<p>They begin to think about timing, presentation, and storytelling, not just functionality.</p>
<h2>What this means for your child</h2>
<p>These skills develop naturally as kids build. They are learning how to:</p>
<ul>
<li>Break down problems</li>
<li>Test ideas</li>
<li>Improve what they create</li>
</ul>
<h2>Final thought</h2>
<p>Every project is more than a result—it is practice in thinking, adjusting, and building with purpose.</p>
  $body$,
  true,
  5,
  'Coding Blocks'
)
on conflict (id) do nothing;
