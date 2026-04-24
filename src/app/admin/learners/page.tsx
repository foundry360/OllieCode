import Link from "next/link";
import { LearnersTable, type LearnerTableRow } from "@/app/admin/learners/learners-table";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminLearnersPage() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-slate-900">Learners</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-600">
            Add <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            so this page can list learner profiles.
          </p>
        </div>
      </div>
    );
  }

  const { data } = await admin
    .from("profiles")
    .select("id,username,created_at,subscription_status,is_admin")
    .order("created_at", { ascending: false })
    .limit(2000);

  const rows = (data ?? []) as LearnerTableRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            <Link href="/admin" className="text-[#5a8f1d] hover:underline">
              Dashboard
            </Link>
            <span aria-hidden className="mx-2 text-slate-300">
              /
            </span>
            <span className="text-slate-700">Learners</span>
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold text-slate-900">Learners</h1>
        </div>
      </div>

      <LearnersTable rows={rows} />
    </div>
  );
}
