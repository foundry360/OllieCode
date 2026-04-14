import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LESSONS,
  getLessonById as getLessonByIdStatic,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";

function cloneLesson(l: LessonCatalogEntry): LessonCatalogEntry {
  return {
    ...l,
    modules: l.modules.map((m) => ({ ...m })),
  };
}

/**
 * Published rows in `lms_lessons` override the in-repo catalog by `id`;
 * new DB-only ids are appended. Final list is **newest first** by `updated_at`
 * when a published row exists; lessons with no DB row keep catalog order among
 * themselves after all timestamped entries.
 */
export async function getMergedPublishedLessons(): Promise<LessonCatalogEntry[]> {
  const base = LESSONS.map(cloneLesson);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return base;

  const { data, error } = await supabase
    .from("lms_lessons")
    .select("id, payload, published, updated_at")
    .eq("published", true);

  if (error || !data?.length) return base;

  const updatedAtById = new Map<string, string>();
  const merged = new Map<string, LessonCatalogEntry>();
  for (const l of base) merged.set(l.id, l);

  for (const row of data) {
    updatedAtById.set(row.id, row.updated_at);
    const v = parseLessonPayload(row.payload);
    if (v && v.id === row.id) merged.set(v.id, cloneLesson(v));
  }

  const ordered: LessonCatalogEntry[] = [];
  for (const l of LESSONS) {
    const m = merged.get(l.id);
    if (m) ordered.push(m);
  }
  const seen = new Set(LESSONS.map((l) => l.id));
  for (const [, lesson] of merged) {
    if (!seen.has(lesson.id)) ordered.push(lesson);
  }

  const catalogIndex = new Map(LESSONS.map((l, i) => [l.id, i]));

  ordered.sort((a, b) => {
    const ma = new Date(updatedAtById.get(a.id) ?? 0).getTime();
    const mb = new Date(updatedAtById.get(b.id) ?? 0).getTime();
    const hasA = updatedAtById.has(a.id);
    const hasB = updatedAtById.has(b.id);
    if (hasA && hasB && ma !== mb) return mb - ma;
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
    const ia = catalogIndex.get(a.id);
    const ib = catalogIndex.get(b.id);
    if (ia != null && ib != null) return ia - ib;
    if (ia != null) return -1;
    if (ib != null) return 1;
    return a.id.localeCompare(b.id);
  });

  return ordered;
}

export async function getLessonByIdMerged(
  lessonId: string,
): Promise<LessonCatalogEntry | undefined> {
  const list = await getMergedPublishedLessons();
  return list.find((l) => l.id === lessonId) ?? getLessonByIdStatic(lessonId);
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
 * Admin editor: prefer a row in `lms_lessons` (draft or published); otherwise merged/static.
 */
export async function getLessonPayloadForAdminEdit(
  lessonId: string,
): Promise<LessonCatalogEntry | undefined> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("lms_lessons")
      .select("payload")
      .eq("id", lessonId)
      .maybeSingle();
    if (data?.payload) {
      const v = parseLessonPayload(data.payload);
      if (v) return cloneLesson(v);
    }
  }
  return getLessonByIdMerged(lessonId);
}
