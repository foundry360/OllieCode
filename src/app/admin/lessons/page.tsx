import Link from "next/link";
import {
  AdminLessonsView,
  type LessonAdminRow,
} from "@/app/admin/lessons/admin-lessons-view";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";
import {
  lessonHeroImageUrl,
  REMOVED_PLATFORM_LESSON_IDS,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  published: boolean;
  updated_at: string;
  payload: unknown;
};

export default async function AdminLessonsPage() {
  const supabase = await createSupabaseServerClient();
  let rows: Row[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("lms_lessons")
      .select("id, published, updated_at, payload");
    rows = ((data ?? []) as Row[]).filter(
      (r) => !REMOVED_PLATFORM_LESSON_IDS.has(r.id),
    );
  }

  type Sortable = { row: LessonAdminRow; ts: number };

  const sortable: Sortable[] = rows.map((r) => {
    const parsed = parseLessonPayload(r.payload);
    const entry: LessonCatalogEntry | null =
      parsed && parsed.id === r.id ? parsed : null;
    return {
      ts: new Date(r.updated_at).getTime(),
      row: {
        id: r.id,
        title: entry?.title ?? r.id,
        published: r.published,
        imageUrl: entry ? lessonHeroImageUrl(entry) : null,
        topic: entry?.topic ?? null,
      } satisfies LessonAdminRow,
    };
  });

  sortable.sort((a, b) => b.ts - a.ts);

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
