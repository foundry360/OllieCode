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
  /** Shown inside the expandable “Show details” panel */
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
};

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
  { value: "Blocks & motion", label: "Blocks & motion" },
  { value: "Sound & looks", label: "Sound & looks" },
  { value: "Games & stories", label: "Games & stories" },
  { value: "Art & design", label: "Art & design" },
];

export const LESSONS: LessonCatalogEntry[] = [
  {
    id: "lvl1-robot-path",
    title: "Robot path",
    summary:
      "Snap a Move block, run your program, and save your first adventure with Ollie.",
    skillLevel: 1,
    workspaceHref: "/workspace?mission=first-move",
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
  return lessonById.get(id);
}

/** URL for the lesson detail page */
export function lessonDetailHref(lessonId: string): string {
  return `/learn/${encodeURIComponent(lessonId)}`;
}

/** Gamified points for list UI (not yet tied to DB). */
export function lessonPointsReward(lesson: LessonCatalogEntry): number {
  const fromModules = lesson.modules.reduce((s, m) => s + m.points, 0);
  if (fromModules > 0) return fromModules;
  return 100 + lesson.estimatedMinutes * 40;
}

export function formatLessonDurationMinutes(mins: number): string {
  if (mins < 60) return `~${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h} hr ${m} mins` : `~${h} hrs`;
}
