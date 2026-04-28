import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeWorkspaceHrefWithLesson,
  REMOVED_PLATFORM_LESSON_IDS,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";

function cloneLesson(l: LessonCatalogEntry): LessonCatalogEntry {
  return {
    ...l,
    modules: l.modules.map((m) => ({ ...m })),
  };
}

function lessonFromPublishedRow(row: {
  id: string;
  payload: unknown;
}): LessonCatalogEntry | null {
  const v = parseLessonPayload(row.payload);
  if (!v || v.id !== row.id) return null;
  const lesson = cloneLesson(v);
  lesson.workspaceHref = normalizeWorkspaceHrefWithLesson(
    lesson.workspaceHref,
    v.id,
  );
  return lesson;
}

/**
 * Published rows in `lms_lessons` only. Newest `updated_at` first.
 */
export async function getMergedPublishedLessons(): Promise<LessonCatalogEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lms_lessons")
    .select("id, payload, published, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) return [];

  const out: LessonCatalogEntry[] = [];
  const seenIds = new Set<string>();
  for (const row of data) {
    if (REMOVED_PLATFORM_LESSON_IDS.has(row.id)) continue;
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    const lesson = lessonFromPublishedRow(row);
    if (lesson) out.push(lesson);
  }
  return out;
}

export async function getLessonByIdMerged(
  lessonId: string,
): Promise<LessonCatalogEntry | undefined> {
  if (REMOVED_PLATFORM_LESSON_IDS.has(lessonId)) return undefined;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("lms_lessons")
    .select("id, payload, published")
    .eq("id", lessonId)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return undefined;
  return lessonFromPublishedRow(data) ?? undefined;
}

/**
 * Up to `limit` lessons for “Learn more” on the lesson detail page: prefer
 * the same {@link LessonCatalogEntry.skillLevel}, then fill from the rest of the hub.
 */
export async function getDiscoverMoreLessons(
  excludeLessonId: string,
  skillLevel: number,
  limit = 8,
): Promise<LessonCatalogEntry[]> {
  const all = await getMergedPublishedLessons();
  const exclude = excludeLessonId;
  const sameLevel = all.filter(
    (l) => l.id !== exclude && l.skillLevel === skillLevel,
  );
  const other = all.filter(
    (l) => l.id !== exclude && l.skillLevel !== skillLevel,
  );
  const out: LessonCatalogEntry[] = [];
  for (const l of sameLevel) {
    if (out.length >= limit) break;
    out.push(l);
  }
  for (const l of other) {
    if (out.length >= limit) break;
    out.push(l);
  }
  return out.slice(0, limit);
}

/**
 * Admin editor: row in `lms_lessons` (draft or published), payload only.
 */
export async function getLessonPayloadForAdminEdit(
  lessonId: string,
): Promise<LessonCatalogEntry | undefined> {
  if (REMOVED_PLATFORM_LESSON_IDS.has(lessonId)) return undefined;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const { data } = await supabase
    .from("lms_lessons")
    .select("id, payload")
    .eq("id", lessonId)
    .maybeSingle();
  if (!data?.payload) return undefined;
  const v = parseLessonPayload(data.payload);
  if (!v || v.id !== data.id) return undefined;
  return cloneLesson(v);
}
