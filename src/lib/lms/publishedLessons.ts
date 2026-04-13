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
 * new DB-only ids are appended after seeded lessons (stable order for filters).
 */
export async function getMergedPublishedLessons(): Promise<LessonCatalogEntry[]> {
  const base = LESSONS.map(cloneLesson);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return base;

  const { data, error } = await supabase
    .from("lms_lessons")
    .select("id, payload, published")
    .eq("published", true);

  if (error || !data?.length) return base;

  const merged = new Map<string, LessonCatalogEntry>();
  for (const l of base) merged.set(l.id, l);

  for (const row of data) {
    const v = parseLessonPayload(row.payload);
    if (v && v.id === row.id) merged.set(v.id, cloneLesson(v));
  }

  const ordered: LessonCatalogEntry[] = [];
  for (const l of LESSONS) {
    const m = merged.get(l.id);
    if (m) ordered.push(m);
  }
  const seen = new Set(LESSONS.map((l) => l.id));
  for (const [id, lesson] of merged) {
    if (!seen.has(id)) ordered.push(lesson);
  }
  return ordered;
}

export async function getLessonByIdMerged(
  lessonId: string,
): Promise<LessonCatalogEntry | undefined> {
  const list = await getMergedPublishedLessons();
  return list.find((l) => l.id === lessonId) ?? getLessonByIdStatic(lessonId);
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
