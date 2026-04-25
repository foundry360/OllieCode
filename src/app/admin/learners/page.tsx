import { LearnersTable, type LearnerTableRow } from "@/app/admin/learners/learners-table";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SELECT_VIEW_FULL =
  "id,username,created_at,subscription_status,is_admin,avatar_slug,parent_email,last_sign_in_at" as const;
const SELECT_FULL =
  "id,username,created_at,subscription_status,is_admin,avatar_slug,parent_email" as const;
const SELECT_AVATAR = "id,username,created_at,subscription_status,is_admin,avatar_slug" as const;
const SELECT_CORE = "id,username,created_at,subscription_status,is_admin" as const;

type LearnerQueryError = { code?: string; message?: string; details?: string; hint?: string } | null;

function isMissingColumnError(err: LearnerQueryError): boolean {
  if (!err) return false;
  if (err.code === "42703") return true;
  const combined = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
  if (combined.includes("42703")) return true;
  if (combined.includes("does not exist") && combined.includes("column")) return true;
  if (combined.includes("could not find") && combined.includes("column")) return true;
  if (
    (combined.includes("parent_email") ||
      combined.includes("avatar_slug") ||
      combined.includes("last_sign_in")) &&
    (combined.includes("does not exist") || combined.includes("not found") || combined.includes("unknown"))
  ) {
    return true;
  }
  return false;
}

function isMissingViewError(err: LearnerQueryError): boolean {
  if (!err) return false;
  if (err.code === "42P01") return true;
  if (err.code === "PGRST205") return true;
  const combined = `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`.toLowerCase();
  if (!combined.includes("admin_learner_profiles")) return false;
  return (
    combined.includes("does not exist") ||
    combined.includes("schema cache") ||
    combined.includes("not found") ||
    combined.includes("unknown") ||
    combined.includes("permission denied")
  );
}

/** View missing/outdated, or PostgREST column error on the view (e.g. before last_sign_in migration). */
function shouldUseProfilesInsteadOfLearnerView(err: LearnerQueryError): boolean {
  return Boolean(err && (isMissingViewError(err) || isMissingColumnError(err)));
}

function parseIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  let ms = Date.parse(t);
  if (Number.isNaN(ms) && /^\d{4}-\d{2}-\d{2} /.test(t)) {
    ms = Date.parse(t.replace(" ", "T"));
  }
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function normalizeLearnerRows(raw: readonly Record<string, unknown>[]): LearnerTableRow[] {
  return raw.map((r) => ({
    id: String(r.id),
    username: typeof r.username === "string" ? r.username : null,
    created_at: String(r.created_at ?? ""),
    subscription_status: String(r.subscription_status ?? "none"),
    is_admin: Boolean(r.is_admin),
    avatar_slug: typeof r.avatar_slug === "string" ? r.avatar_slug : null,
    parent_email:
      typeof r.parent_email === "string" && r.parent_email.trim() ? r.parent_email.trim() : null,
    last_sign_in_at: parseIsoOrNull(r.last_sign_in_at),
  }));
}

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

  const listProfiles = (columns: string) =>
    admin
      .from("profiles")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(2000);

  const listFromAdminView = () =>
    admin
      .from("admin_learner_profiles")
      .select(SELECT_VIEW_FULL)
      .order("created_at", { ascending: false })
      .limit(2000);

  let data: readonly Record<string, unknown>[] | null = null;
  let error: LearnerQueryError = null;

  const first = await listFromAdminView();
  data = (first.data ?? null) as readonly Record<string, unknown>[] | null;
  error = first.error as LearnerQueryError;

  if (error && shouldUseProfilesInsteadOfLearnerView(error)) {
    const fallback = await listProfiles(SELECT_FULL);
    data = (fallback.data ?? null) as readonly Record<string, unknown>[] | null;
    error = fallback.error as LearnerQueryError;
  }

  if (error && isMissingColumnError(error)) {
    const second = await listProfiles(SELECT_AVATAR);
    data = (second.data ?? null) as readonly Record<string, unknown>[] | null;
    error = second.error as LearnerQueryError;
  }

  if (error && isMissingColumnError(error)) {
    const third = await listProfiles(SELECT_CORE);
    data = (third.data ?? null) as readonly Record<string, unknown>[] | null;
    error = third.error as LearnerQueryError;
  }

  if (error) {
    console.error("[admin/learners] profiles query:", error.message);
  }

  const rows = normalizeLearnerRows(data ?? []);

  return <LearnersTable rows={rows} />;
}
