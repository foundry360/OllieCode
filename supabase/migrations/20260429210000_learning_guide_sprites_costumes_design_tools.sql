/*
  Learning Hub guide: sprites, costumes, drawing, and uploads (design tools).
  Design Tools & Backdrops section; after backdrops-and-scenes (sort 0).
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
  'sprites-costumes-design-tools',
  'Sprites & Costumes (Design Tools)',
  'Library sprites, costumes, the costume editor, and image uploads—how kids organize characters and turn ideas into something visible on the stage.',
  null,
  $body$
<p>Sprites and costumes are how kids bring characters and ideas to life. These tools give them control over how things look, move, and change.</p>
<h2>Sprites overview</h2>
<h3>Creating and managing characters</h3>
<p>Sprites are the characters or objects in a project.</p>
<p>Kids can:</p>
<ul>
<li>Add new sprites from a built-in library</li>
<li>Choose ones that match their idea (animals, objects, people, and more)</li>
<li>Rename sprites to keep things organized</li>
<li>Select which sprite they are working on at any time</li>
</ul>
<p>They begin to understand that:</p>
<ul>
<li>Each sprite has its own behavior</li>
<li>Multiple sprites can interact in one project</li>
</ul>
<h2>Costumes</h2>
<h3>Changing how things look</h3>
<p>Costumes are different appearances for a single sprite.</p>
<p>Kids use costumes to:</p>
<ul>
<li>Switch how a character looks</li>
<li>Show movement (like walking or jumping)</li>
<li>Represent different states (happy, sad, active, inactive)</li>
</ul>
<p>They can:</p>
<ul>
<li>Choose from pre-made costumes</li>
<li>Create their own designs</li>
</ul>
<p>This introduces the idea that one object can have many visual states.</p>
<h2>Drawing a costume</h2>
<h3>Creating something original</h3>
<p>Kids can open the costume editor to draw their own designs.</p>
<p>Simple tips that help:</p>
<ul>
<li>Keep designs clear and easy to see on the stage</li>
<li>Use the available canvas space effectively</li>
<li>Start simple, then add detail over time</li>
</ul>
<p>This encourages creativity while also building awareness of how things appear in context.</p>
<h2>Uploading images</h2>
<h3>Using custom artwork</h3>
<p>Kids can upload their own images to use as sprites or costumes.</p>
<p>Helpful guidelines:</p>
<ul>
<li>Use common formats (like PNG or JPG)</li>
<li>Keep file sizes manageable so projects run smoothly</li>
<li>Choose images that are easy to see and work well on the stage</li>
</ul>
<p>This allows them to:</p>
<ul>
<li>Personalize their projects</li>
<li>Bring in ideas from outside the platform</li>
</ul>
<h2>What this means for your child</h2>
<p>Sprites and costumes help kids think about both design and function.</p>
<p>They learn to:</p>
<ul>
<li>Organize characters and elements</li>
<li>Show change visually</li>
<li>Combine creativity with structure</li>
</ul>
<h2>Final thought</h2>
<p>Sprites and costumes turn ideas into something visible and interactive—helping kids move from imagining to creating.</p>
  $body$,
  true,
  5,
  'Design Tools & Backdrops'
)
on conflict (id) do nothing;
