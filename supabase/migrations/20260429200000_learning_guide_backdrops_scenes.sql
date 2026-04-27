/*
  Learning Hub guide: backdrops, scenes, layers, and tying visuals to blocks.
  Design Tools & Backdrops section; first guide in that section (sort 0).
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
  'backdrops-and-scenes',
  'Backdrops & Scenes',
  'How kids pick backdrops, change scenes over time, and connect what is on the stage to blocks that switch or react to scenes.',
  null,
  $body$
<p>Backdrops (or scenes) set the stage for everything your child creates. Whether it is a game, story, or animation, the backdrop helps define the world—and can even become part of how the project works.</p>
<h2>Choosing a backdrop</h2>
<h3>Setting the scene</h3>
<p>Kids can open the scene or backdrop picker to browse a library of options.</p>
<p>They will learn to:</p>
<ul>
<li>Explore categories (like nature, space, city, and more)</li>
<li>Choose a backdrop that fits the idea they are building</li>
<li>Think about how the setting supports the story or game</li>
</ul>
<p>This is often the first creative decision—where does this take place?</p>
<h2>Layering and changing scenes</h2>
<h3>Creating variety and progression</h3>
<p>The stage can change over time, allowing projects to feel more dynamic.</p>
<p>Kids can:</p>
<ul>
<li>Switch between different backdrops during a project</li>
<li>Use scene changes to show progress (like moving to the next level)</li>
<li>Create simple transitions between moments in a story</li>
</ul>
<p>With multiple scene layers, they begin to see:</p>
<ul>
<li>How backgrounds and characters work together</li>
<li>How visual changes can signal something new is happening</li>
</ul>
<h2>Backdrops in code</h2>
<h3>Connecting design to behavior</h3>
<p>Backdrops are not just visual—they can also trigger actions.</p>
<p>Kids learn to:</p>
<ul>
<li>Switch scenes using simple blocks (like changing backdrop or scene)</li>
<li>React when a scene changes (for example, starting a new level)</li>
</ul>
<p>This is an early step in understanding:</p>
<ul>
<li>How visuals and logic connect</li>
<li>How one change can affect the whole project</li>
</ul>
<h2>What this means for your child</h2>
<p>Backdrops help kids think beyond individual actions and start designing experiences.</p>
<p>They begin to:</p>
<ul>
<li>Plan how a project flows</li>
<li>Use visuals to communicate ideas</li>
<li>Connect what they see with how things behave</li>
</ul>
<h2>Final thought</h2>
<p>A simple background can become a story, a level, or a signal that something new is happening. It is where creativity and structure start to come together.</p>
  $body$,
  true,
  0,
  'Design Tools & Backdrops'
)
on conflict (id) do nothing;
