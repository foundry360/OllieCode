/*
  Replace Parent quick start guide copy with Welcome to Ollie Code (same id for stable URLs).
*/

update public.lms_learning_guides
set
  title = 'Welcome to Ollie Code',
  summary = 'Accounts, the Learning Hub, and how to cheer kids on—plus what to expect as they grow from guided steps to their own projects. No coding background required.',
  body_html = $body$
<p>We are glad you are here. Ollie Code is designed to help kids learn coding by creating—building games, animations, and interactive projects in a way that feels natural and fun.</p>
<p>This short guide will help you understand how the platform works, what your child will experience, and how you can support them along the way—no coding background required.</p>
<h2>Accounts</h2>
<h3>Getting started safely and simply</h3>
<p>Each learner uses their own account, which keeps their projects, progress, and creations organized.</p>
<p>For younger learners:</p>
<ul>
<li>Parents or caregivers may receive an approval email to grant consent</li>
<li>This helps ensure accounts are set up safely and appropriately</li>
</ul>
<p>Once set up:</p>
<ul>
<li>Your child can sign in and return to their work anytime</li>
<li>Their projects and progress stay connected to their account</li>
</ul>
<h2>Learning Hub</h2>
<h3>Where learning and exploration begin</h3>
<p>The <a href="/learn" rel="noopener noreferrer">Learning Hub</a> is where your child can find:</p>
<ul>
<li>Guided lessons and step-by-step adventures</li>
<li>Helpful guides and examples</li>
<li>New content as it becomes available</li>
</ul>
<p>As your child progresses:</p>
<ul>
<li>Lessons will open when they are ready in the workspace</li>
<li>They can revisit previous lessons or explore new ones at their own pace</li>
</ul>
<p>It is designed to provide structure when needed—while still leaving room for creativity.</p>
<h2>Cheering them on</h2>
<h3>Supporting confidence and curiosity</h3>
<p>One of the most important parts of learning to code is encouragement.</p>
<p>As your child builds:</p>
<ul>
<li>Celebrate completed steps, even small ones</li>
<li>Encourage experimentation and trying new ideas</li>
<li>Treat mistakes as part of the process—not something to avoid</li>
</ul>
<p>You do not need to have the answers. What matters most is:</p>
<ul>
<li>Showing interest in what they are creating</li>
<li>Asking simple questions like &quot;What does this do?&quot; or &quot;What are you building?&quot;</li>
</ul>
<p>Confidence grows when kids feel supported, especially as they figure things out on their own.</p>
<h2>What to expect</h2>
<p>As your child uses Ollie Code, they will move from following guided steps to creating their own projects. Along the way, they will build confidence, problem-solving skills, and a better understanding of how technology works.</p>
<h2>Final thought</h2>
<p>Ollie Code is built to make learning feel like creating—so kids stay engaged, curious, and proud of what they build.</p>
  $body$
where id = 'parent-quick-start';
