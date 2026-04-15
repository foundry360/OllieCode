import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LESSONS,
  getLessonById as getLessonByIdStatic,
  normalizeWorkspaceHrefWithLesson,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";

function cloneLesson(l: LessonCatalogEntry): LessonCatalogEntry {
  return {
    ...l,
    modules: l.modules.map((m) => ({ ...m })),
  };
}

async function fetchDraftLessonIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("lms_lessons")
    .select("id")
    .eq("published", false);
  if (error || !data?.length) return new Set();
  return new Set(data.map((r) => r.id));
}

export type MergedPublishedLessonsOptions = {
  /**
   * When true (default), catalog lessons that have an `lms_lessons` row with
   * `published: false` are omitted (draft = hidden from Learning Hub). Admin
   * tooling can set false to resolve merged content for editing.
   */
  hideCatalogDrafts?: boolean;
};

/**
 * Published rows in `lms_lessons` override the in-repo catalog by `id`;
 * new DB-only ids are appended. Final list is **newest first** by `updated_at`
 * when a published row exists; lessons with no DB row keep catalog order among
 * themselves after all timestamped entries.
 *
 * Draft rows (`published: false`) do not override the catalog payload, but when
 * {@link MergedPublishedLessonsOptions.hideCatalogDrafts} is true (default),
 * those lesson ids are excluded from the result so the hub matches admin copy.
 */
export async function getMergedPublishedLessons(
  options: MergedPublishedLessonsOptions = {},
): Promise<LessonCatalogEntry[]> {
  const hideCatalogDrafts = options.hideCatalogDrafts ?? true;
  const base = LESSONS.map(cloneLesson);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return base;

  const draftIds =
    hideCatalogDrafts && supabase
      ? await fetchDraftLessonIds(supabase)
      : new Set<string>();

  const { data, error } = await supabase
    .from("lms_lessons")
    .select("id, payload, published, updated_at")
    .eq("published", true);

  if (error) {
    if (!hideCatalogDrafts) return base;
    return base.filter((l) => !draftIds.has(l.id));
  }

  if (!data?.length) {
    const merged = new Map<string, LessonCatalogEntry>();
    for (const l of base) merged.set(l.id, l);
    const ordered: LessonCatalogEntry[] = [];
    for (const l of LESSONS) {
      const m = merged.get(l.id);
      if (m && !draftIds.has(l.id)) ordered.push(m);
    }
    const seen = new Set(LESSONS.map((l) => l.id));
    for (const [, lesson] of merged) {
      if (!seen.has(lesson.id) && !draftIds.has(lesson.id)) ordered.push(lesson);
    }
    const catalogIndex = new Map(LESSONS.map((l, i) => [l.id, i]));
    ordered.sort((a, b) => {
      const ia = catalogIndex.get(a.id);
      const ib = catalogIndex.get(b.id);
      if (ia != null && ib != null) return ia - ib;
      if (ia != null) return -1;
      if (ib != null) return 1;
      return a.id.localeCompare(b.id);
    });
    return ordered;
  }

  const updatedAtById = new Map<string, string>();
  const merged = new Map<string, LessonCatalogEntry>();
  for (const l of base) merged.set(l.id, l);

  for (const row of data) {
    updatedAtById.set(row.id, row.updated_at);
    const v = parseLessonPayload(row.payload);
    if (!v || v.id !== row.id) continue;

    const staticMatch = getLessonByIdStatic(row.id);
    if (staticMatch) {
      const fromDb = cloneLesson(v);
      merged.set(v.id, {
        ...cloneLesson(staticMatch),
        ...fromDb,
        modules:
          fromDb.modules.length > 0 ? fromDb.modules : staticMatch.modules,
        visualSteps:
          fromDb.visualSteps && fromDb.visualSteps.length > 0
            ? fromDb.visualSteps
            : staticMatch.visualSteps,
        bodyHtml: !isTrivialLessonHtml(fromDb.bodyHtml)
          ? fromDb.bodyHtml
          : staticMatch.bodyHtml,
        workspaceHref: normalizeWorkspaceHrefWithLesson(
          fromDb.workspaceHref ?? staticMatch.workspaceHref,
          v.id,
        ),
      });
    } else {
      const only = cloneLesson(v);
      only.workspaceHref = normalizeWorkspaceHrefWithLesson(
        only.workspaceHref,
        v.id,
      );
      merged.set(v.id, only);
    }
  }

  const ordered: LessonCatalogEntry[] = [];
  for (const l of LESSONS) {
    const m = merged.get(l.id);
    if (m && !draftIds.has(l.id)) ordered.push(m);
  }
  const seen = new Set(LESSONS.map((l) => l.id));
  for (const [, lesson] of merged) {
    if (!seen.has(lesson.id) && !draftIds.has(lesson.id)) ordered.push(lesson);
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
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const draftIds = await fetchDraftLessonIds(supabase);
    if (draftIds.has(lessonId)) return undefined;
  }
  const list = await getMergedPublishedLessons({ hideCatalogDrafts: true });
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
  const list = await getMergedPublishedLessons({ hideCatalogDrafts: false });
  return (
    list.find((l) => l.id === lessonId) ?? getLessonByIdStatic(lessonId)
  );
}
