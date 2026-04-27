import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLearningGuideAction } from "@/app/admin/guides/actions";
import { GuideEditorForm } from "@/app/admin/guides/guide-editor-form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  title: string;
  summary: string;
  body_html: string;
  card_image_url: string | null;
  published: boolean;
  sort_order: number;
};

export default async function AdminEditGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const sp = (await searchParams) ?? {};

  const admin = getSupabaseAdmin();
  const supabase = admin ?? (await createSupabaseServerClient());
  if (!supabase) notFound();

  const { data, error } = await supabase
    .from("lms_learning_guides")
    .select("id, title, summary, body_html, card_image_url, published, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const row = data as Row;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm">
        <Link href="/admin/guides" className="font-semibold text-[#3f6212] underline">
          ← Learning Guides
        </Link>
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Edit guide</h1>
      <p className="mt-1 font-mono text-xs text-slate-500">{row.id}</p>

      {sp.saved === "1" ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Saved.
        </p>
      ) : null}

      <GuideEditorForm
        mode="edit"
        initialValues={{
          id: row.id,
          title: row.title,
          summary: row.summary,
          body_html: row.body_html,
          card_image_url: row.card_image_url ?? "",
          published: row.published,
          sort_order: row.sort_order,
        }}
      />

      <form action={deleteLearningGuideAction} className="mt-12 border-t border-slate-200 pt-8">
        <input type="hidden" name="id" value={row.id} />
        <h2 className="text-sm font-bold text-slate-900">Danger zone</h2>
        <p className="mt-1 text-sm text-slate-600">Permanently remove this guide from the database.</p>
        <button
          type="submit"
          className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
        >
          Delete guide
        </button>
      </form>
    </div>
  );
}
