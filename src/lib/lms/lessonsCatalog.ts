import type { VisualLessonStep } from "@/lib/lms/visualLessonTypes";

/**
 * Platform lesson catalog — skill-gated cards on `/learn`.
 * IDs are stable for progress tracking in `user_lesson_completions`.
 */
export type LessonModule = {
  id: string;
  title: string;
  points: number;
  durationMins: number;
  steps: number;
  /** Rich HTML inside the expandable “Show details” panel */
  detail: string;
};

export type LessonCatalogEntry = {
  id: string;
  title: string;
  summary: string;
  skillLevel: number;
  /** Workspace deep link; empty when the lesson is not wired yet */
  workspaceHref: string | null;
  /** Minutes shown on the card */
  estimatedMinutes: number;
  /** Filter: topic / track (e.g. Motion, Sound) */
  topic: string;
  /** Filter: learning goal label */
  objective: string;
  /** Stats bar — human-readable level (e.g. Beginner) */
  levelName: string;
  /** Stats bar — audience / persona */
  roleLabel: string;
  /** Optional hero image for hub cards (URL) */
  cardImageUrl?: string | null;
  /** Optional thumbnail for list/badge-style use (URL) */
  thumbnailUrl?: string | null;
  /**
   * Rich HTML for the lesson detail page (intro above modules).
   * Hub cards still use {@link summary} (plain text).
   */
  bodyHtml?: string | null;
  /** Timeline modules on `/learn/[lessonId]` */
  modules: LessonModule[];
  /** Optional visual step-by-step cards in the workspace lesson panel. */
  visualSteps?: VisualLessonStep[];
};

/**
 * Learning Hub cards and list rows: use wide **card** art first; only use
 * {@link LessonCatalogEntry.thumbnailUrl} when no card image is set.
 */
export function lessonHeroImageUrl(l: LessonCatalogEntry): string | null {
  const card = l.cardImageUrl?.trim();
  if (card) return card;
  const thumb = l.thumbnailUrl?.trim();
  return thumb || null;
}

/** Admin lesson grid cards only: wide card art — never the thumbnail. */
export function lessonCardImageOnly(l: LessonCatalogEntry): string | null {
  const card = l.cardImageUrl?.trim();
  return card || null;
}

export const MIN_SKILL_LEVEL = 1;
export const MAX_PUBLISHED_LEVEL = 1;

/** Display name for stats bar / filters; keep in sync with {@link skillLevel}. */
export function levelNameForSkillLevel(skillLevel: number): string {
  if (skillLevel <= 1) return "Beginner";
  if (skillLevel === 2) return "Intermediate";
  if (skillLevel === 3) return "Advanced";
  if (skillLevel === 4) return "Expert";
  return `Level ${skillLevel}`;
}

/** Values offered when creating a lesson (skill gating may still use {@link MAX_PUBLISHED_LEVEL}). */
export const LESSON_SKILL_LEVEL_OPTIONS = [1, 2, 3, 4] as const;

/** Preset hub topic / category (stored as `topic` on catalog entries). */
export const LESSON_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "General", label: "General" },
  { value: "Fundamentals", label: "Fundamentals" },
  { value: "Blocks & motion", label: "Blocks & motion" },
  { value: "Sound & looks", label: "Sound & looks" },
  { value: "Games & stories", label: "Games & stories" },
  { value: "Art & design", label: "Art & design" },
];

/**
 * When `/workspace` has no `?lesson=` query, the workspace lesson panel loads this lesson.
 */
export const DEFAULT_WORKSPACE_LESSON_ID = "lvl1-get-started" as const;

/**
 * `?lesson=none` — lesson panel shows the Learning Hub empty state, not Getting Started
 * (e.g. after **New adventure** in the workspace header).
 */
export const WORKSPACE_NO_LESSON_QUERY = "none" as const;

/**
 * Lesson ids permanently removed from the platform. Hub, API, and admin flows ignore these
 * even if a legacy `lms_lessons` row existed before DB cleanup.
 */
export const REMOVED_PLATFORM_LESSON_IDS = new Set<string>(["lvl1-paddle-vertical"]);

export const LESSONS: LessonCatalogEntry[] = [
  {
    id: "lvl1-get-started",
    title: "Getting Started",
    summary:
      "Run the Welcome Bot, explore your first blocks, then save a named copy of your adventure—your on-ramp to Ollie Code.",
    bodyHtml:
      "<p>This lesson walks you through the <strong>Welcome to Ollie Code</strong> starter: two small programs that run together when you tap <strong>Run</strong>. You’ll meet the <strong>Welcome bot</strong> costume, use <strong>Save</strong> to keep your own copy in the cloud, and find it again under <strong>Adventures</strong>. Work through each module while your workspace is open.</p>",
    skillLevel: 1,
    workspaceHref:
      "/workspace?mission=first-move&lesson=lvl1-get-started",
    estimatedMinutes: 18,
    topic: "General",
    objective: "Get started",
    levelName: "Beginner",
    roleLabel: "Learner",
    cardImageUrl: "/images/lesson-getting-started-welcomebot.png",
    modules: [
      {
        id: "getstarted-m1",
        title: "Run the Welcome Bot",
        points: 120,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Open this lesson in the workspace (you should see the <strong>Welcome bot</strong> in the scene). You’ll have <strong>two</strong> stacks that both start with <strong>When Run clicked</strong>:</p><ul><li>One loop uses <strong>next costume</strong> and a short <strong>wait</strong> so the sprite animates.</li><li>The other loop <strong>says</strong> <strong>Hi friend!</strong> for five seconds, over and over.</li></ul><p>Tap <strong>Run</strong> and watch the stage and speech bubble. Tap <strong>Run</strong> again if you need to reset.</p>",
      },
      {
        id: "getstarted-m2",
        title: "How the blocks fit together",
        points: 100,
        durationMins: 3,
        steps: 3,
        detail:
          "<p>Blocks are grouped by color in the palette—like puzzle pieces you drag into the middle.</p><ul><li><strong>Light orange</strong> blocks are for <strong>events</strong> (such as <strong>When Run clicked</strong>).</li><li><strong>Purple</strong> <strong>Looks</strong> blocks can <strong>say</strong> something on the stage.</li><li><strong>Orange</strong> <strong>Control</strong> blocks include <strong>forever</strong> and <strong>wait</strong>.</li></ul><p>You can have more than one <strong>When Run clicked</strong> stack; when you press <strong>Run</strong>, they all start together.</p>",
      },
      {
        id: "getstarted-m3",
        title: "Sign in for the cloud",
        points: 80,
        durationMins: 2,
        steps: 2,
        detail:
          "<p>To keep your projects on your account, <strong>sign in</strong> from the workspace header (or from the site’s login page). Once you’re signed in, saves can sync to the cloud so you can come back on another device.</p>",
      },
      {
        id: "getstarted-m4",
        title: "Save your own named copy",
        points: 200,
        durationMins: 5,
        steps: 4,
        detail:
          "<p>The <strong>Welcome to Ollie Code</strong> adventure is a <strong>starter template</strong>: it’s there to help everyone begin the same way. When you’re signed in, <strong>Save</strong> asks you to <strong>name your own copy</strong>—that becomes <strong>your</strong> project you can keep editing.</p><p>Pick a name you’ll recognize, confirm, and stay on the new adventure when the workspace switches to it. After that, <strong>Save</strong> updates <strong>your</strong> copy.</p>",
      },
      {
        id: "getstarted-m5",
        title: "Adventures and new projects",
        points: 120,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Open <strong>Adventures</strong> from the toolbar to see your <strong>saved named copies</strong>—not the starter template itself. Tap a card to open that project.</p><p>Use <strong>New adventure</strong> when you want a fresh blank canvas; use <strong>Save</strong> there too to give it a name and keep it in your list.</p>",
      },
      {
        id: "getstarted-m6",
        title: "What’s next",
        points: 100,
        durationMins: 2,
        steps: 2,
        detail:
          "<p>Visit the <strong>Learning Hub</strong> for more lessons on blocks, motion, and games. You can return to this workspace anytime from a lesson’s <strong>Open workspace</strong> link or by choosing your adventure from <strong>Adventures</strong>.</p>",
      },
    ],
  },
  {
    id: "lvl1-robot-path",
    title: "Robot path",
    summary:
      "Snap a Move block, run your program, and save your first adventure with Ollie.",
    bodyHtml:
      "<p>Connect blocks in the workspace, tap <strong>Run</strong> to try your program, then <strong>Save</strong> to keep your adventure in the cloud. Use the modules below as your checklist while you build.</p>",
    skillLevel: 1,
    workspaceHref: "/workspace?mission=first-move&lesson=lvl1-robot-path",
    estimatedMinutes: 15,
    topic: "Blocks & motion",
    objective: "Get started",
    levelName: "Beginner",
    roleLabel: "Learner",
    modules: [
      {
        id: "robot-m1",
        title: "Meet the stage",
        points: 100,
        durationMins: 5,
        steps: 2,
        detail:
          "Open the workspace, pick a backdrop you like, and find Ollie on the stage.",
      },
      {
        id: "robot-m2",
        title: "Snap a Move block",
        points: 150,
        durationMins: 6,
        steps: 3,
        detail:
          "Under “When run clicked”, attach a Move block so Ollie can roll forward.",
      },
      {
        id: "robot-m3",
        title: "Run and save",
        points: 200,
        durationMins: 4,
        steps: 2,
        detail:
          "Tap Run, watch the path, then Save so your adventure is stored in the cloud.",
      },
    ],
  },
  {
    id: "lvl1-meet-blockly",
    title: "Meet Ollie Code",
    summary:
      "Drag colorful blocks, snap them together, and tap Run—your first hello in Ollie Code!",
    bodyHtml:
      "<p>Welcome to <strong>Ollie Code</strong>! Blockly blocks are like puzzle pieces: you <strong>drag</strong> them, <strong>snap</strong> them together, and tap <strong>Run</strong> to see what happens. Look for a <strong>Green</strong> <strong>when run clicked</strong> block and a <strong>Purple</strong> <strong>say</strong> block to say hello.</p>",
    skillLevel: 1,
    workspaceHref: "/workspace?mission=first-move&lesson=lvl1-meet-blockly",
    estimatedMinutes: 7,
    topic: "Fundamentals",
    objective: "Meet Ollie Code",
    levelName: "Beginner",
    roleLabel: "Explorer",
    modules: [
      {
        id: "blockly-m1",
        title: "Find the blocks",
        points: 8,
        durationMins: 2,
        steps: 3,
        detail:
          "<p>Look at the block palette on the side. Blocks are grouped by color. You’ll use a <strong>Green</strong> block for starting and a <strong>Purple</strong> block for saying something. Try <strong>clicking and dragging</strong>—no need to know every block yet!</p>",
      },
      {
        id: "blockly-m2",
        title: "Drag and drop",
        points: 10,
        durationMins: 2,
        steps: 3,
        detail:
          "<p>Pick the <strong>Green</strong> <strong>when run clicked</strong> block. Drag it to the middle of the workspace and let go. That’s <strong>drag and drop</strong>! The big empty area is where your program lives.</p>",
      },
      {
        id: "blockly-m3",
        title: "Snap blocks together",
        points: 12,
        durationMins: 2,
        steps: 3,
        detail:
          "<p>Drag a <strong>Purple</strong> <strong>say</strong> block (like one that says hello) so it <strong>clicks underneath</strong> the <strong>Green</strong> start block. When blocks snap into a stack, the top tells the computer when to start, and the ones below tell it what to do.</p>",
      },
      {
        id: "blockly-m4",
        title: "Press Run",
        points: 15,
        durationMins: 2,
        steps: 3,
        detail:
          "<p>Make sure your stack has <strong>when run clicked</strong> on top and <strong>say Hello!</strong> (or your say block) snapped below. Tap <strong>Run</strong>. You should see your message—hello! If nothing happens, check that your blocks are snapped, then try <strong>Run</strong> again.</p>",
      },
    ],
  },
  {
    id: "lvl1-sounds-colors",
    title: "Sounds & colors",
    summary:
      "Play notes and tint the stage — coming soon on the platform.",
    skillLevel: 1,
    workspaceHref: null,
    estimatedMinutes: 20,
    topic: "Sound & looks",
    objective: "Explore & create",
    levelName: "Beginner",
    roleLabel: "Learner",
    modules: [
      {
        id: "sound-m1",
        title: "Sounds & looks overview",
        points: 0,
        durationMins: 20,
        steps: 0,
        detail:
          "This lesson is not wired to the workspace yet. Check back soon for blocks to play sounds and tint the canvas.",
      },
    ],
  },
  {
    id: "lvl1-count-loop",
    title: "Count with a loop",
    summary:
      "Use repeat blocks to count and draw patterns — a gentle intro to loops before you add sensors.",
    skillLevel: 1,
    workspaceHref: null,
    estimatedMinutes: 18,
    topic: "Blocks & motion",
    objective: "Explore & create",
    levelName: "Beginner",
    roleLabel: "Learner",
    modules: [
      {
        id: "loop-m1",
        title: "Why repeat?",
        points: 80,
        durationMins: 5,
        steps: 2,
        detail:
          "See how one loop can run the same stack many times instead of copying blocks by hand.",
      },
      {
        id: "loop-m2",
        title: "Set a counter",
        points: 120,
        durationMins: 7,
        steps: 3,
        detail:
          "Pick how many times Ollie should repeat an action and watch the stage update each time.",
      },
      {
        id: "loop-m3",
        title: "Try a simple pattern",
        points: 160,
        durationMins: 6,
        steps: 2,
        detail:
          "Combine moves in a loop to trace a shape. Save when you like the result.",
      },
    ],
  },
  {
    id: "lvl1-story-starter",
    title: "Story starter",
    summary:
      "Plan a tiny scene: characters, a goal, and what happens when the player clicks Run — practice before you add blocks.",
    skillLevel: 1,
    workspaceHref: null,
    estimatedMinutes: 14,
    topic: "Games & stories",
    objective: "Explore & create",
    levelName: "Beginner",
    roleLabel: "Learner",
    modules: [
      {
        id: "story-m1",
        title: "Pick your cast",
        points: 70,
        durationMins: 4,
        steps: 2,
        detail:
          "Choose who is on stage and one simple rule: what should Ollie try to do first?",
      },
      {
        id: "story-m2",
        title: "Write the beat",
        points: 100,
        durationMins: 5,
        steps: 2,
        detail:
          "Sketch the order of events in plain language — beginning, middle, and a small surprise.",
      },
      {
        id: "story-m3",
        title: "Share the pitch",
        points: 130,
        durationMins: 5,
        steps: 2,
        detail:
          "Tell a friend or write one sentence for the lesson notes so you can build it in the workspace later.",
      },
    ],
  },
  {
    id: "lvl1-motion-lab",
    title: "Motion Hub",
    summary:
      "Move, turn, and choreograph Ollie on the stage—stack motion blocks, use short waits, then loop a path and save your routine.",
    bodyHtml:
      "<p>In <strong>Motion Hub</strong> you’ll stay inside the <strong>Motion</strong> palette: move forward, turn, add pauses, and wrap steps in a <strong>repeat</strong> or <strong>forever</strong> so the same path runs again and again. Keep <strong>Run</strong> handy after each change, and <strong>Save</strong> when you like what you built.</p>",
    skillLevel: 1,
    workspaceHref: "/workspace?mission=first-move&lesson=lvl1-motion-lab",
    estimatedMinutes: 24,
    topic: "Blocks & motion",
    objective: "Motion & paths",
    levelName: "Beginner",
    roleLabel: "Learner",
    modules: [
      {
        id: "motionhub-m1",
        title: "Roll forward on Run",
        points: 70,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Start with <strong>When Run clicked</strong> (green). Snap <strong>move forward</strong> underneath so Ollie rolls when you tap <strong>Run</strong>.</p><ul><li>Try a few different step counts on the move block.</li><li>Press <strong>Run</strong> again to replay from the start.</li></ul>",
      },
      {
        id: "motionhub-m2",
        title: "Turn before the next move",
        points: 80,
        durationMins: 5,
        steps: 3,
        detail:
          "<p>Add a <strong>turn</strong> block (or <strong>turn left</strong> / <strong>turn right</strong>) between two moves so Ollie changes facing.</p><ul><li>Watch the stage arrow so you know which way is “forward”.</li><li>Chain: move → turn → move, then <strong>Run</strong>.</li></ul>",
      },
      {
        id: "motionhub-m3",
        title: "Choreograph with waits",
        points: 90,
        durationMins: 5,
        steps: 3,
        detail:
          "<p>Drop <strong>wait</strong> blocks (Control) between motions so each step reads clearly—like beats in a dance.</p><ul><li>Short waits feel snappy; longer waits feel dramatic.</li><li>Combine say/think from Looks if you want a line between moves.</li></ul>",
      },
      {
        id: "motionhub-m4",
        title: "Loop your path",
        points: 100,
        durationMins: 6,
        steps: 4,
        detail:
          "<p>Wrap part of your stack in <strong>repeat</strong> or use <strong>forever</strong> so the path keeps going.</p><ul><li><strong>Repeat</strong> is great for “do this exactly N times.”</li><li><strong>Forever</strong> keeps going—use <strong>Stop</strong> when you want to halt while testing.</li></ul>",
      },
      {
        id: "motionhub-m5",
        title: "Edge bounce & save",
        points: 110,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Optional: try <strong>if on edge, bounce</strong> inside a move loop so Ollie stays on stage.</p><p>When you’re happy, <strong>Save</strong> your adventure so this motion routine lives in <strong>Adventures</strong> for next time.</p>",
      },
    ],
  },
  {
    id: "lvl1-pandle-pong",
    title: "Pandle Pong",
    summary:
      "Build a two-sprite pong-style game: backdrop, paddle, and a ball from the sprite catalog—then add score, balls left, and a Game Over message with color-coded blocks.",
    bodyHtml:
      "<p><strong>Pandle Pong</strong> uses exactly <strong>one backdrop</strong> and <strong>two sprites</strong> on the stage. Follow each module in order while your workspace is open.</p><p><strong>How to read block colors</strong> (they match the toolbox categories): <span style='color:#FFBF00'><strong>Events</strong></span> · <span style='color:#59C059'><strong>Motion</strong></span> · <span style='color:#9966FF'><strong>Looks</strong></span> · <span style='color:#FFAB19'><strong>Control</strong></span> · <span style='color:#5CB1D6'><strong>Sensing</strong></span> · <span style='color:#4C97FF'><strong>Logic</strong></span> · <span style='color:#59C059'><strong>Numbers</strong></span> · <span style='color:#FF8C1A'><strong>Variables</strong></span> · <span style='color:#9966FF'><strong>Text</strong></span> (join messages).</p>",
    skillLevel: 1,
    workspaceHref:
      "/workspace?mission=first-move&lesson=lvl1-pandle-pong",
    estimatedMinutes: 35,
    topic: "Games & stories",
    objective: "Sprites, motion & variables",
    levelName: "Beginner",
    roleLabel: "Learner",
    cardImageUrl: "/images/features-build-games-v2.png",
    modules: [
      {
        id: "pandle-m1",
        title: "Rules: two sprites + one backdrop",
        points: 60,
        durationMins: 3,
        steps: 2,
        detail:
          "<p>Your finished game has <strong>two actors</strong> (Paddle + Ball) and <strong>one</strong> backdrop. Use <strong>Adventures</strong> naming when you save so you can find the project later.</p>",
      },
      {
        id: "pandle-m2",
        title: "Pick or paint the backdrop",
        points: 80,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Open the <strong>scene / backdrop</strong> controls and choose a look for your court (solid color or image backdrop).</p><p>Then stack: <span style='color:#FFBF00'><strong>When Run clicked</strong></span> → <span style='color:#9966FF'><strong>switch scene to</strong></span> so every run starts on the same backdrop.</p>",
      },
      {
        id: "pandle-m3",
        title: "Sprite 1: build the paddle",
        points: 90,
        durationMins: 5,
        steps: 3,
        detail:
          "<p>Rename your first sprite <strong>Paddle</strong>. Give it a <strong>wide, flat</strong> costume: open the <strong>sprite library</strong> or <strong>paint</strong> a simple horizontal bar.</p><p>Optional: <span style='color:#9966FF'><strong>set size to</strong></span> so the paddle feels right on the stage.</p>",
      },
      {
        id: "pandle-m4",
        title: "Sprite 2: ball from the catalog",
        points: 100,
        durationMins: 5,
        steps: 4,
        detail:
          "<p><strong>Add a second sprite</strong> from the <strong>sprite catalog</strong>. Pick something round (a ball-like costume). Rename it <strong>Ball</strong>.</p><p>Use <span style='color:#9966FF'><strong>set size to</strong></span> if the ball is too big or too small.</p>",
      },
      {
        id: "pandle-m5",
        title: "Paddle: move with arrow keys",
        points: 110,
        durationMins: 6,
        steps: 4,
        detail:
          "<p>On the <strong>Paddle</strong> sprite, drag two hats from <span style='color:#FFBF00'><strong>Events</strong></span>: <strong>when left arrow key pressed</strong> and <strong>when right arrow key pressed</strong>.</p><p>Under each, add <span style='color:#59C059'><strong>change x by</strong></span>: use a <span style='color:#59C059'><strong>small negative</strong></span> number for left and a <span style='color:#59C059'><strong>small positive</strong></span> number for right. Tap <strong>Run</strong>, then hold the keys to slide.</p>",
      },
      {
        id: "pandle-m6",
        title: "Ball: bounce around the stage",
        points: 120,
        durationMins: 7,
        steps: 5,
        detail:
          "<p>On the <strong>Ball</strong> sprite: <span style='color:#FFBF00'><strong>When Run clicked</strong></span> → <span style='color:#59C059'><strong>go to x: y:</strong></span> (start near the top center using <span style='color:#59C059'><strong>number</strong></span> blocks from <strong>Numbers</strong>).</p><p>Add <span style='color:#FFAB19'><strong>forever</strong></span>. Inside: <span style='color:#59C059'><strong>move forward</strong></span> (or small <strong>change x / change y</strong>) and <span style='color:#59C059'><strong>if on edge, bounce</strong></span> so the ball stays in the court.</p>",
      },
      {
        id: "pandle-m7",
        title: "Score when the ball hits the paddle",
        points: 130,
        durationMins: 7,
        steps: 5,
        detail:
          "<p>In <span style='color:#FF8C1A'><strong>Variables</strong></span>, make a variable named <strong>Score</strong>. On <strong>Run</strong>, <strong>set Score to 0</strong>.</p><p>Inside the ball loop, add <span style='color:#4C97FF'><strong>if</strong></span> with <span style='color:#5CB1D6'><strong>touching Paddle?</strong></span>. In the <strong>then</strong> branch: bounce the ball up (<span style='color:#59C059'><strong>change y by</strong></span> or <strong>point in direction</strong> + <strong>move forward</strong>) and <span style='color:#FF8C1A'><strong>change Score by 1</strong></span>.</p>",
      },
      {
        id: "pandle-m8",
        title: "Balls left (lives)",
        points: 120,
        durationMins: 6,
        steps: 4,
        detail:
          "<p>Create <span style='color:#FF8C1A'><strong>Balls left</strong></span> in <strong>Variables</strong>. On <strong>Run</strong>, set it to <span style='color:#59C059'><strong>3</strong></span> (or another number you choose).</p><p>When the ball misses (for example it passes the paddle line—use <span style='color:#4C97FF'><strong>if</strong></span> with a <span style='color:#59C059'><strong>compare</strong></span> on y-position), <span style='color:#FF8C1A'><strong>change Balls left by -1</strong></span> and reset the ball position with <span style='color:#59C059'><strong>go to x: y:</strong></span>.</p>",
      },
      {
        id: "pandle-m9",
        title: "Game Over message",
        points: 140,
        durationMins: 6,
        steps: 5,
        detail:
          "<p>Still with <span style='color:#4C97FF'><strong>if</strong></span>: when <span style='color:#FF8C1A'><strong>Balls left</strong></span> equals <span style='color:#59C059'><strong>0</strong></span>, show <span style='color:#9966FF'><strong>say</strong></span> for a few seconds. Use <span style='color:#9966FF'><strong>join</strong></span> (<strong>Text</strong>) to combine words like <strong>Game Over! Score:</strong> with the <span style='color:#FF8C1A'><strong>Score</strong></span> block.</p><p>Then add <span style='color:#FFAB19'><strong>stop all</strong></span> so loops end.</p>",
      },
      {
        id: "pandle-m10",
        title: "Save and play-test",
        points: 100,
        durationMins: 4,
        steps: 3,
        detail:
          "<p><strong>Save</strong> your named adventure. Play-test: score should go up on hits, balls left should count down, and Game Over should appear at zero.</p>",
      },
    ],
  },
  {
    id: "lvl1-free-falling",
    title: "Free Falling",
    summary:
      "Build a catch game: a Bowl at the bottom, a falling Orange, arrow-key movement, gravity, a Score variable, and a pop when you catch it.",
    bodyHtml:
      "<p>In <strong>Free Falling</strong> you use <strong>two sprites</strong>: a <strong>Bowl</strong> (catcher) and a falling object (we use <strong>Orange</strong> from the sprite catalog—you can swap for another costume). Work in the <strong>Motion</strong>, <strong>Control</strong>, <strong>Sensing</strong>, <strong>Variables</strong>, and <strong>Sound</strong> categories. Tap <strong>Run</strong> to try your game, and <strong>Save</strong> when you like it.</p><p><strong>How to read block colors</strong>: <span style='color:#FFBF00'><strong>Events</strong></span> · <span style='color:#59C059'><strong>Motion</strong></span> · <span style='color:#9966FF'><strong>Looks</strong></span> · <span style='color:#FFAB19'><strong>Control</strong></span> · <span style='color:#5CB1D6'><strong>Sensing</strong></span> · <span style='color:#FF8C1A'><strong>Variables</strong></span> · <span style='color:#CF63CF'><strong>Sound</strong></span> · <span style='color:#59C059'><strong>Numbers</strong></span> · <span style='color:#4C97FF'><strong>Logic</strong></span>.</p>",
    skillLevel: 1,
    workspaceHref:
      "/workspace?mission=first-move&lesson=lvl1-free-falling",
    estimatedMinutes: 32,
    topic: "Games & stories",
    objective: "Sprites, loops & variables",
    levelName: "Beginner",
    roleLabel: "Learner",
    cardImageUrl: "/images/features-build-games-v2.png",
    modules: [
      {
        id: "freefall-m1",
        title: "Set up your sprites",
        points: 80,
        durationMins: 5,
        steps: 4,
        detail:
          "<p>Add <strong>two sprites</strong> from the sprite library: pick <strong>Bowl</strong> for the catcher and <strong>Orange</strong> (or another fruit, star, or costume you like) for the falling object. Rename them so you can tell them apart.</p><p>On <strong>each</strong> sprite, add <span style='color:#FFBF00'><strong>When Run clicked</strong></span> → <span style='color:#9966FF'><strong>shrink by</strong></span> <span style='color:#59C059'><strong>40</strong></span> (from <strong>Looks</strong>) so both fit the stage nicely—that brings size from 100% down toward 60%.</p>",
      },
      {
        id: "freefall-m2",
        title: "Place the Bowl at the bottom",
        points: 90,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Select the <strong>Bowl</strong> sprite. Under <span style='color:#FFBF00'><strong>When Run clicked</strong></span>, snap <span style='color:#59C059'><strong>go to x: y:</strong></span> and plug in <span style='color:#59C059'><strong>number</strong></span> blocks: <strong>x</strong> = <strong>0</strong>, <strong>y</strong> = <strong>−70</strong>.</p><p>That centers the Bowl near the <strong>bottom</strong> of the stage in Scratch-style coordinates, ready to slide left and right.</p>",
      },
      {
        id: "freefall-m3",
        title: "Add left and right movement",
        points: 100,
        durationMins: 6,
        steps: 5,
        detail:
          "<p>Still on the <strong>Bowl</strong>, add a second stack (another hat is OK) or continue under the first—use <span style='color:#FFAB19'><strong>forever</strong></span> from <strong>Control</strong>.</p><p>Inside the loop, use <span style='color:#4C97FF'><strong>if</strong></span> with <span style='color:#5CB1D6'><strong>key right arrow pressed?</strong></span> (from <strong>Sensing</strong>): in the <strong>then</strong> branch, <span style='color:#59C059'><strong>change x by</strong></span> <span style='color:#59C059'><strong>4</strong></span>. Add another <strong>if</strong> for <strong>key left arrow pressed?</strong> and <strong>change x by</strong> <span style='color:#59C059'><strong>−4</strong></span>.</p><p>Tap <strong>Run</strong> and hold the arrow keys—the Bowl should glide smoothly.</p>",
      },
      {
        id: "freefall-m4",
        title: "Make the object fall",
        points: 110,
        durationMins: 7,
        steps: 5,
        detail:
          "<p>On the <strong>Orange</strong> (falling) sprite, use <span style='color:#FFBF00'><strong>When Run clicked</strong></span> → <span style='color:#FFAB19'><strong>forever</strong></span>.</p><p>Inside: <span style='color:#59C059'><strong>change y by</strong></span> <span style='color:#59C059'><strong>−0.9</strong></span> each frame to simulate <strong>gravity</strong>. Then add <span style='color:#4C97FF'><strong>if</strong></span> with <span style='color:#4C97FF'><strong>compare</strong></span>: <span style='color:#5CB1D6'><strong>y position</strong></span> <strong>&lt;</strong> <span style='color:#59C059'><strong>−170</strong></span>. In <strong>then</strong>: <span style='color:#59C059'><strong>go to</strong></span> <strong>random position</strong>, then <span style='color:#59C059'><strong>set y to</strong></span> <span style='color:#59C059'><strong>170</strong></span> so it respawns at the top and falls again.</p>",
      },
      {
        id: "freefall-m5",
        title: "Create the Score variable",
        points: 85,
        durationMins: 3,
        steps: 3,
        detail:
          "<p>Open <span style='color:#FF8C1A'><strong>Variables</strong></span> and click <strong>Make a variable</strong>. Name it <strong>Score</strong>.</p><p>On the <strong>Bowl</strong> (or either sprite), under <span style='color:#FFBF00'><strong>When Run clicked</strong></span> before the game runs, add <span style='color:#FF8C1A'><strong>set Score to</strong></span> <span style='color:#59C059'><strong>0</strong></span>.</p>",
      },
      {
        id: "freefall-m6",
        title: "Detect a catch and score",
        points: 120,
        durationMins: 8,
        steps: 6,
        detail:
          "<p>On the <strong>Orange</strong> sprite, add a <strong>second</strong> <span style='color:#FFAB19'><strong>forever</strong></span> loop (two forever stacks both run together).</p><p>Inside this loop: <span style='color:#4C97FF'><strong>if</strong></span> <span style='color:#5CB1D6'><strong>touching Bowl?</strong></span> (pick <strong>Bowl</strong> in the menu). In <strong>then</strong>: <span style='color:#FF8C1A'><strong>change Score by</strong></span> <span style='color:#59C059'><strong>1</strong></span>, <span style='color:#CF63CF'><strong>play sound</strong></span> <strong>pop</strong>, <span style='color:#59C059'><strong>go to</strong></span> <strong>random position</strong>, and <span style='color:#59C059'><strong>set y to</strong></span> <span style='color:#59C059'><strong>180</strong></span> so the fruit resets above the stage.</p>",
      },
      {
        id: "freefall-m7",
        title: "Test and play",
        points: 95,
        durationMins: 4,
        steps: 3,
        detail:
          "<p>Tap <strong>Run</strong>. Catch oranges with the Bowl and watch <strong>Score</strong> go up each time you hear <strong>pop</strong>.</p><p><strong>Save</strong> your adventure when you are happy—you built a real game!</p>",
      },
    ],
  },
  {
    id: "lvl1-art-splash",
    title: "Art splash",
    summary:
      "Splash color on the canvas with simple stamps — a quick creative break between motion lessons.",
    skillLevel: 1,
    workspaceHref: null,
    estimatedMinutes: 12,
    topic: "Art & design",
    objective: "Explore & create",
    levelName: "Beginner",
    roleLabel: "Learner",
    modules: [
      {
        id: "art-m1",
        title: "Pick a palette",
        points: 50,
        durationMins: 4,
        steps: 2,
        detail:
          "Choose two colors and plan where each stamp might land on the stage.",
      },
    ],
  },
];

export function lessonsForSkillLevel(level: number): LessonCatalogEntry[] {
  return LESSONS.filter((l) => l.skillLevel === level);
}

export function lessonsByLevel(): Map<number, LessonCatalogEntry[]> {
  const map = new Map<number, LessonCatalogEntry[]>();
  for (const lesson of LESSONS) {
    const list = map.get(lesson.skillLevel) ?? [];
    list.push(lesson);
    map.set(lesson.skillLevel, list);
  }
  return map;
}

const lessonById = new Map(LESSONS.map((l) => [l.id, l]));

export function getLessonById(id: string): LessonCatalogEntry | undefined {
  if (REMOVED_PLATFORM_LESSON_IDS.has(id)) return undefined;
  return lessonById.get(id);
}

/** URL for the lesson detail page */
export function lessonDetailHref(lessonId: string): string {
  return `/learn/${encodeURIComponent(lessonId)}`;
}

/**
 * Ensures workspace deep links include `?lesson=<id>` so the workspace lesson panel
 * can load instructions. Published payloads may store only `mission=`.
 */
/** Valid `?lesson=` id for persisting on saved adventures (excludes `none` and removed ids). */
export function hubLessonIdFromWorkspaceLessonQuery(
  rawLessonId: string,
): string | undefined {
  const t = rawLessonId.trim();
  if (!t || t === WORKSPACE_NO_LESSON_QUERY) return undefined;
  if (REMOVED_PLATFORM_LESSON_IDS.has(t)) return undefined;
  return t;
}

export function normalizeWorkspaceHrefWithLesson(
  href: string | null | undefined,
  lessonId: string,
): string | null {
  const trimmed = href?.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed, "https://ollie.invalid");
    u.searchParams.set("lesson", lessonId);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return trimmed;
  }
}

/** Gamified points for list UI (not yet tied to DB). */
export function lessonPointsReward(lesson: LessonCatalogEntry): number {
  const fromModules = lesson.modules.reduce((s, m) => s + m.points, 0);
  if (fromModules > 0) return fromModules;
  return 100 + lesson.estimatedMinutes * 40;
}

const intFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** Locale-aware digits for points, steps, etc. (e.g. 1,200). */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return intFmt.format(Math.round(value));
}

/** "+1,200 points" — used on lesson detail + hub. */
export function formatPointsLabel(points: number): string {
  return `+${formatCount(points)} points`;
}

/** "~45 min", "~1 hr", "~1 hr 15 min"; invalid/zero → em dash. */
export function formatLessonDurationMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  const m = Math.round(mins);
  if (m < 60) {
    return m === 1 ? "~1 min" : `~${formatCount(m)} min`;
  }
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (rest === 0) {
    return h === 1 ? "~1 hr" : `~${formatCount(h)} hr`;
  }
  if (h === 1) {
    return rest === 1 ? "~1 hr 1 min" : `~1 hr ${formatCount(rest)} min`;
  }
  return `~${formatCount(h)} hr ${formatCount(rest)} min`;
}

/** Same rules as lesson duration — module timeline rows. */
export function formatModuleDurationMinutes(mins: number): string {
  return formatLessonDurationMinutes(mins);
}

/** "1 step" / "12 steps"; empty string when steps ≤ 0. */
export function formatStepCountLabel(steps: number): string {
  if (!Number.isFinite(steps) || steps <= 0) return "";
  return steps === 1 ? "1 step" : `${formatCount(steps)} steps`;
}
