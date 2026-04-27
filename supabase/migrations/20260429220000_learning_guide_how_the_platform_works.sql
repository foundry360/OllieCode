/*
  Learning Hub guide: adventures vs free build, saving, run/stop/reset, lesson rail, import/export.
  Ollie Code Basics section; sort between parent-quick-start (1) and FAQ (20).
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
  'how-the-platform-works',
  'Ollie Code Basics: How the Platform Works',
  'For parents: how adventures and free build fit together, saving and reopening work, run/stop/reset, the lesson rail, and optional project backup.',
  null,
  $body$
<p>Ollie Code is designed to feel simple for kids, but as a parent, it helps to understand how the different parts fit together. This guide walks through the key pieces of the experience so you know what your child is seeing and doing.</p>
<h2>Adventures vs free build</h2>
<h3>Starting with guidance—or exploring freely</h3>
<p>When your child begins, they can choose between structured experiences and open creation.</p>
<h3>Adventures</h3>
<p>These are guided projects that:</p>
<ul>
<li>Walk kids step-by-step through building something</li>
<li>Introduce new ideas gradually</li>
<li>Provide a clear starting point and goal</li>
</ul>
<p>Each adventure is like a mini learning path. When switching adventures:</p>
<ul>
<li>The project workspace updates to match that activity</li>
<li>Instructions and steps change to guide the new activity</li>
</ul>
<h3>Free build</h3>
<p>This is a blank or open space where kids can:</p>
<ul>
<li>Create anything they want</li>
<li>Experiment without step-by-step instructions</li>
<li>Apply what they have already learned</li>
</ul>
<p>Behind the scenes, each adventure or project is tied to a specific setup—so switching between them changes what your child sees and works on.</p>
<h2>Saving and reopening work</h2>
<h3>Keeping progress safe</h3>
<p>Ollie Code allows projects to be saved so kids can come back to them later.</p>
<p>Kids can:</p>
<ul>
<li>Save their work with a name</li>
<li>Reopen saved projects from a saved adventures or projects list</li>
</ul>
<p>It is helpful to understand:</p>
<ul>
<li>&quot;Saved&quot; means the project is stored and can be reopened later</li>
<li>If your platform includes cloud saving, projects may sync across sessions</li>
<li>If not saved, work may only exist in the current browser session</li>
</ul>
<p>Encourage your child to name their projects clearly—it makes it easier to find them later.</p>
<h2>Run, stop, and reset</h2>
<h3>How projects start and restart</h3>
<p>These controls help kids test what they have built.</p>
<ul>
<li><strong>Run</strong> starts the project and executes all active scripts</li>
<li><strong>Stop</strong> halts everything currently happening</li>
<li><strong>Reset</strong> returns the stage to its starting state</li>
</ul>
<p>The reset is especially important:</p>
<ul>
<li>It clears movement, changes, or loops from the previous run</li>
<li>It ensures each test starts fresh</li>
</ul>
<p>This helps reduce confusion when something &quot;keeps going&quot; from an earlier run.</p>
<h2>Lessons rail &amp; steps</h2>
<h3>Guidance alongside building</h3>
<p>In adventure-based experiences, kids see a lesson panel (or &quot;rail&quot;) with steps.</p>
<p>This panel:</p>
<ul>
<li>Breaks the project into manageable steps</li>
<li>Provides instructions or hints</li>
<li>Guides kids without taking control away</li>
</ul>
<p>The layout is intentional:</p>
<ul>
<li>Instructions on one side</li>
<li>Blocks and building in the center</li>
<li>Stage (what they see) updating in real time</li>
</ul>
<p>Kids can move step-by-step or revisit earlier steps as needed.</p>
<h2>Project backup (import / export)</h2>
<h3>Saving a copy outside the platform</h3>
<p>If available, Ollie Code may allow projects to be downloaded and uploaded.</p>
<p>This means:</p>
<ul>
<li>Kids (or parents) can export a project as a file</li>
<li>That file can be stored as a backup</li>
<li>It can later be imported to continue working</li>
</ul>
<p>This is useful for:</p>
<ul>
<li>Keeping important projects safe</li>
<li>Sharing work between devices</li>
<li>Preserving progress over time</li>
</ul>
<p>Think of it like saving a copy of a document outside the app.</p>
<h2>What this means for your child</h2>
<p>Ollie Code is structured to balance guidance and freedom.</p>
<p>Your child can:</p>
<ul>
<li>Start with step-by-step adventures</li>
<li>Move into independent creation</li>
<li>Save and revisit their work</li>
<li>Test and improve ideas easily</li>
</ul>
<h2>Final thought</h2>
<p>The platform is designed to stay out of the way—so kids can focus on building, exploring, and learning by doing, while still having the structure they need to succeed.</p>
  $body$,
  true,
  3,
  'Ollie Code Basics'
)
on conflict (id) do nothing;
