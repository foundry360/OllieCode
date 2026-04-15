import Link from "next/link";
import {
  AdminLessonsView,
  type LessonAdminRow,
} from "@/app/admin/lessons/admin-lessons-view";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";
import {
  LESSONS,
  lessonHeroImageUrl,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  published: boolean;
  updated_at: string;
  payload: unknown;
};

function cloneLesson(l: LessonCatalogEntry): LessonCatalogEntry {
  return {
    ...l,
    modules: l.modules.map((m) => ({ ...m })),
  };
}

/** Static catalog + DB `lms_lessons.payload` so card/thumbnail URLs from uploads show in admin. */
function mergeStaticWithDbPayload(
  staticLesson: LessonCatalogEntry,
  dbRow: Row | undefined,
): LessonCatalogEntry {
  if (!dbRow) return cloneLesson(staticLesson);
  const v = parseLessonPayload(dbRow.payload);
  if (!v || v.id !== staticLesson.id) return cloneLesson(staticLesson);
  return {
    ...cloneLesson(staticLesson),
    ...cloneLesson(v),
    modules:
      v.modules.length > 0
        ? v.modules.map((m) => ({ ...m }))
        : staticLesson.modules.map((m) => ({ ...m })),
  };
}

export default async function AdminLessonsPage() {
  const supabase = await createSupabaseServerClient();
  let rows: Row[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("lms_lessons")
      .select("id, published, updated_at, payload");
    rows = (data ?? []) as Row[];
  }

  const rowById = new Map(rows.map((r) => [r.id, r]));
  const staticIds = new Set(LESSONS.map((l) => l.id));
  const dbOnlyRows = rows.filter((r) => !staticIds.has(r.id));
  const catalogIndex = new Map(LESSONS.map((l, i) => [l.id, i]));

  type Sortable = { row: LessonAdminRow; ts: number | null };

  const sortable: Sortable[] = [
    ...LESSONS.map((lesson) => {
      const row = rowById.get(lesson.id);
      const ts = row ? new Date(row.updated_at).getTime() : null;
      const merged = mergeStaticWithDbPayload(lesson, row);
      return {
        ts,
        row: {
          id: lesson.id,
          title: lesson.title,
          inDatabase: Boolean(row),
          published: row ? row.published : null,
          isDbOnly: false,
          imageUrl: lessonHeroImageUrl(merged),
          topic: lesson.topic,
        } satisfies LessonAdminRow,
      };
    }),
    ...dbOnlyRows.map((r) => {
      const parsed = parseLessonPayload(r.payload);
      return {
        ts: new Date(r.updated_at).getTime(),
        row: {
          id: r.id,
          title: parsed?.title ?? r.id,
          inDatabase: true,
          published: r.published,
          isDbOnly: true,
          imageUrl: parsed ? lessonHeroImageUrl(parsed) : null,
          topic: parsed?.topic ?? null,
        } satisfies LessonAdminRow,
      };
    }),
  ];

  sortable.sort((a, b) => {
    const ta = a.ts;
    const tb = b.ts;
    if (ta != null && tb != null && ta !== tb) return tb - ta;
    if (ta != null && tb == null) return -1;
    if (ta == null && tb != null) return 1;
    const ia = catalogIndex.get(a.row.id);
    const ib = catalogIndex.get(b.row.id);
    if (ia != null && ib != null) return ia - ib;
    if (ia != null) return -1;
    if (ib != null) return 1;
    return a.row.id.localeCompare(b.row.id);
  });

  const lessonRows = sortable.map((s) => s.row);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Lessons
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Edit and publish from here or create a new lesson.
          </p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="inline-flex items-center justify-center self-start rounded-xl bg-[#84c126] px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] sm:self-end"
        >
          New lesson
        </Link>
      </div>

      <AdminLessonsView rows={lessonRows} />
    </div>
  );
}
