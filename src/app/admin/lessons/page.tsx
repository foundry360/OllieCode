import Link from "next/link";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";
import { LESSONS } from "@/lib/lms/lessonsCatalog";
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
      .select("id, published, updated_at, payload")
      .order("id");
    rows = (data ?? []) as Row[];
  }

  const rowById = new Map(rows.map((r) => [r.id, r]));
  const staticIds = new Set(LESSONS.map((l) => l.id));
  const dbOnlyRows = rows.filter((r) => !staticIds.has(r.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Lessons
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            The app merges published database rows with the default catalog in
            code (same <code className="text-xs">id</code> replaces the
            built-in entry). Edit and publish from here or create a new lesson.
          </p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="inline-flex items-center justify-center self-start rounded-xl bg-[#84c126] px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] sm:self-end"
        >
          New lesson
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Lesson id</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Database</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {LESSONS.map((lesson) => {
              const row = rowById.get(lesson.id);
              return (
                <tr key={lesson.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {lesson.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {lesson.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row ? "Yes" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row ? (
                      <span
                        className={
                          row.published
                            ? "rounded-full bg-[#ecfccb] px-2 py-0.5 text-xs font-semibold text-[#365314]"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                        }
                      >
                        {row.published ? "Live" : "Draft"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/lessons/${encodeURIComponent(lesson.id)}/edit`}
                      className="font-semibold text-[#84c126] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {dbOnlyRows.map((row) => {
              const parsed = parseLessonPayload(row.payload);
              const label = parsed?.title ?? row.id;
              return (
                <tr key={row.id} className="bg-[#f8fafc] hover:bg-slate-100/80">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {row.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {label}{" "}
                    <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      DB only
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">Yes</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.published
                          ? "rounded-full bg-[#ecfccb] px-2 py-0.5 text-xs font-semibold text-[#365314]"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                      }
                    >
                      {row.published ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/lessons/${encodeURIComponent(row.id)}/edit`}
                      className="font-semibold text-[#84c126] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
