import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Row = {
  id: string;
  title: string;
  published: boolean;
  sort_order: number;
  updated_at: string;
  section: string | null;
};

function isLearningGuidesTableMissing(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("lms_learning_guides") &&
    (m.includes("schema cache") ||
      m.includes("does not exist") ||
      m.includes("could not find") ||
      m.includes("pgrst205") ||
      m.includes("42p01"))
  );
}

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const err = sp.error;

  let rows: Row[] = [];
  let listError: string | null = null;

  const admin = getSupabaseAdmin();

  if (admin) {
    const { data, error } = await admin
      .from("lms_learning_guides")
      .select("id, title, published, sort_order, updated_at, section")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) listError = error.message;
    else rows = (data ?? []) as Row[];
  } else {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("lms_learning_guides")
        .select("id, title, published, sort_order, updated_at, section")
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      if (error) listError = error.message;
      else rows = (data ?? []) as Row[];
    }
  }

  const tableMissing = isLearningGuidesTableMissing(listError);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Learning Guides</h1>
          <p className="mt-1 text-sm text-slate-600">
            HTML guides shown on the Learning Hub under the &quot;Learning Guides&quot; tab.
          </p>
        </div>
        <Link
          href="/admin/guides/new"
          className="inline-flex items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
        >
          New guide
        </Link>
      </div>

      {err ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </p>
      ) : null}

      {listError && tableMissing ? (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/90 px-5 py-5 text-sm leading-relaxed text-sky-950 shadow-sm">
          <p className="font-display text-base font-bold text-sky-950">Database table not found</p>
          <p className="mt-2 text-sky-900">
            The <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">lms_learning_guides</code>{" "}
            table is not in this Supabase project yet (migrations not applied).
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sky-900">
            <li>
              From the repo root, run{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">supabase db push</code> (or link
              the project and push migrations), <strong className="font-semibold">or</strong>
            </li>
            <li>
              In the Supabase Dashboard → <strong className="font-semibold">SQL Editor</strong>, run the SQL in{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
                supabase/migrations/20260426130000_lms_learning_guides.sql
              </code>
              , then{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
                20260427100000_learning_guide_how_to_activate_lesson.sql
              </code>{" "}
              and{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
                20260427110000_learning_guides_title_case_in_guide_body.sql
              </code>{" "}
              if you use those seeds.
            </li>
            <li>
              In Dashboard → <strong className="font-semibold">Settings → API</strong>, click{" "}
              <strong className="font-semibold">Reload schema</strong> if PostgREST still shows a schema cache error.
            </li>
          </ol>
        </div>
      ) : listError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Could not load guides: {listError}
        </p>
      ) : null}

      {!listError && rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm leading-relaxed text-slate-600">
          No Learning Guides yet.{" "}
          <Link href="/admin/guides/new" className="font-semibold text-[#3f6212] underline">
            Create one
          </Link>
          , or run the latest Supabase migration to load the sample guide.
          {!admin ? (
            <>
              {" "}
              If you already saved a <strong className="font-semibold text-slate-800">draft</strong> but it does not
              show here, add{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to
              your env (same as the Learners admin page) or set{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">is_admin = true</code> on your row
              in <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">profiles</code> so RLS allows
              listing unpublished guides.
            </>
          ) : null}
        </p>
      ) : !listError ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="text-slate-800">
                  <td className="px-4 py-3 tabular-nums text-slate-600">{r.sort_order}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-slate-600">{r.section?.trim() || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                  <td className="px-4 py-3">{r.published ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(r.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/guides/${encodeURIComponent(r.id)}/edit`}
                      className="font-semibold text-[#3f6212] underline hover:text-[#84c126]"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
