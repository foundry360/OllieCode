import type {
  LessonCatalogEntry,
  LessonModule,
} from "@/lib/lms/lessonsCatalog";
import { levelNameForSkillLevel } from "@/lib/lms/lessonsCatalog";

function randomHex(byteLength: number): string {
  const u = new Uint8Array(byteLength);
  crypto.getRandomValues(u);
  return Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** URL-safe id: lowercase letters, numbers, hyphens; 2–64 chars. */
export function sanitizeLessonId(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (s.length < 2 || s.length > 64) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

/**
 * Produces a valid lesson id from the title plus a random suffix.
 * Used when admins do not supply an id manually.
 */
export function generateNewLessonId(title: string): string {
  const fromTitle = sanitizeLessonId(title.trim());
  const prefix =
    fromTitle && fromTitle.length >= 2 ? fromTitle : "lesson";
  const rand = randomHex(4);
  const suffix = `-${rand}`;
  const maxPrefix = 64 - suffix.length;
  const stem = prefix.length > maxPrefix ? prefix.slice(0, maxPrefix) : prefix;
  return `${stem}${suffix}`;
}

export type NewLessonBasics = {
  summary: string;
  /** Hub filter “topic” / track (category); default General */
  topic?: string;
  /** Catalog skill level; default 1 */
  skillLevel?: number;
  cardImageUrl?: string | null;
  thumbnailUrl?: string | null;
};

/** Minimal valid lesson for a new admin draft (saved to `lms_lessons`). */
export function buildDefaultLessonCatalogEntry(
  id: string,
  title: string,
  basics?: NewLessonBasics,
): LessonCatalogEntry {
  const t = title.trim() || "New lesson";
  const summary =
    basics?.summary?.trim() || "Short description for the Learning Hub.";
  const topic = basics?.topic?.trim() || "General";
  const skillLevel =
    typeof basics?.skillLevel === "number" && Number.isFinite(basics.skillLevel)
      ? Math.max(1, Math.floor(basics.skillLevel))
      : 1;
  const entry: LessonCatalogEntry = {
    id,
    title: t,
    summary,
    skillLevel,
    workspaceHref: null,
    estimatedMinutes: 15,
    topic,
    objective: "Learn",
    levelName: levelNameForSkillLevel(skillLevel),
    roleLabel: "Learner",
    modules: [
      {
        id: `${id}-m1`,
        title: "First module",
        points: 100,
        durationMins: 15,
        steps: 1,
        detail: "Add module details in the editor.",
      },
    ],
  };
  const card = basics?.cardImageUrl?.trim();
  const thumb = basics?.thumbnailUrl?.trim();
  if (card) entry.cardImageUrl = card;
  if (thumb) entry.thumbnailUrl = thumb;
  return entry;
}

function isLessonModule(x: unknown): x is LessonModule {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.points === "number" &&
    typeof o.durationMins === "number" &&
    typeof o.steps === "number" &&
    typeof o.detail === "string"
  );
}

/** Validates JSON from `lms_lessons.payload` or admin editor. */
export function parseLessonPayload(raw: unknown): LessonCatalogEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.title !== "string") return null;
  if (typeof o.summary !== "string") return null;
  if (typeof o.skillLevel !== "number") return null;
  if (o.workspaceHref !== null && typeof o.workspaceHref !== "string") return null;
  if (typeof o.estimatedMinutes !== "number") return null;
  if (typeof o.topic !== "string") return null;
  if (typeof o.objective !== "string") return null;
  if (typeof o.levelName !== "string") return null;
  if (typeof o.roleLabel !== "string") return null;
  if (
    "cardImageUrl" in o &&
    o.cardImageUrl != null &&
    typeof o.cardImageUrl !== "string"
  ) {
    return null;
  }
  if (
    "thumbnailUrl" in o &&
    o.thumbnailUrl != null &&
    typeof o.thumbnailUrl !== "string"
  ) {
    return null;
  }
  if ("bodyHtml" in o && o.bodyHtml != null && typeof o.bodyHtml !== "string") {
    return null;
  }
  if (!Array.isArray(o.modules) || !o.modules.every(isLessonModule)) return null;
  return o as unknown as LessonCatalogEntry;
}
