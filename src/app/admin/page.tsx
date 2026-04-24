import Link from "next/link";
import {
  BookOpen,
  FolderKanban,
  UserRound,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";
import { LESSONS } from "@/lib/lms/lessonsCatalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RecentLessonRow = {
  id: string;
  published: boolean;
  updated_at: string;
  payload: unknown;
};

type RecentLearnerRow = {
  id: string;
  username: string | null;
  created_at: string;
  subscription_status: string;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSubscriptionStatus(status: string | null | undefined): string {
  const value = status?.trim() || "none";
  if (value === "none") return "No subscription";
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function learnerName(username: string | null | undefined, userId: string): string {
  const value = username?.trim();
  if (value) return value;
  return `Learner ${userId.slice(0, 8)}`;
}

function SectionCard({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  Icon,
  cardClassName,
  iconClassName,
}: Readonly<{
  label: string;
  value: string;
  Icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
}>) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${cardClassName}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="font-display mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-slate-900">Dashboard</h1>
        <SectionCard title="Admin data unavailable">
          <p className="text-sm leading-relaxed text-slate-600">
            Add `SUPABASE_SERVICE_ROLE_KEY` so the admin dashboard can read platform-wide metrics and
            recent learner activity.
          </p>
        </SectionCard>
      </div>
    );
  }

  const lessonTitleById = new Map(LESSONS.map((lesson) => [lesson.id, lesson.title]));

  const [
    learnersCountRes,
    activeSubscribersCountRes,
    pendingApprovalsCountRes,
    liveLessonsCountRes,
    savedProjectsCountRes,
    pastDueCountRes,
    canceledCountRes,
    noSubscriptionCountRes,
    recentLessonsRes,
    recentLearnersRes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("subscription_status", ["active", "trialing"]),
    admin
      .from("pending_signups")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", new Date().toISOString()),
    admin.from("lms_lessons").select("*", { count: "exact", head: true }).eq("published", true),
    admin.from("saved_mission_progress").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "past_due"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "canceled"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "none"),
    admin
      .from("lms_lessons")
      .select("id,published,updated_at,payload")
      .order("updated_at", { ascending: false })
      .limit(6),
    admin
      .from("profiles")
      .select("id,username,created_at,subscription_status")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const recentLessonsRaw = (recentLessonsRes.data ?? []) as RecentLessonRow[];
  const recentLessons = recentLessonsRaw.slice(0, 5);

  const recentLearnersRaw = (recentLearnersRes.data ?? []) as RecentLearnerRow[];
  const recentLearners = recentLearnersRaw.slice(0, 5);
  const hasMoreRecentLearners = recentLearnersRaw.length > 5;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/lessons"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Open lessons
          </Link>
          <Link
            href="/admin/lessons/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020]"
          >
            New lesson
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Learner Profiles"
          value={formatCount(learnersCountRes.count ?? 0)}
          Icon={UsersRound}
          cardClassName="border-sky-200 bg-sky-50/80"
          iconClassName="bg-sky-100 text-sky-700"
        />
        <StatCard
          label="Active Subscribers"
          value={formatCount(activeSubscribersCountRes.count ?? 0)}
          Icon={UserRoundCheck}
          cardClassName="border-emerald-200 bg-emerald-50/80"
          iconClassName="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Live Lessons"
          value={formatCount(liveLessonsCountRes.count ?? 0)}
          Icon={BookOpen}
          cardClassName="border-violet-200 bg-violet-50/80"
          iconClassName="bg-violet-100 text-violet-700"
        />
        <StatCard
          label="Saved Projects"
          value={formatCount(savedProjectsCountRes.count ?? 0)}
          Icon={FolderKanban}
          cardClassName="border-amber-200 bg-amber-50/80"
          iconClassName="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Pending Approvals"
          value={formatCount(pendingApprovalsCountRes.count ?? 0)}
          Icon={UserRound}
          cardClassName="border-rose-200 bg-rose-50/80"
          iconClassName="bg-rose-100 text-rose-700"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Subscription Health">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active / Trialing</p>
              <p className="font-display mt-1 text-2xl font-bold text-slate-900">
                {formatCount(activeSubscribersCountRes.count ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Past Due</p>
              <p className="font-display mt-1 text-2xl font-bold text-slate-900">
                {formatCount(pastDueCountRes.count ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Canceled</p>
              <p className="font-display mt-1 text-2xl font-bold text-slate-900">
                {formatCount(canceledCountRes.count ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">No Subscription</p>
              <p className="font-display mt-1 text-2xl font-bold text-slate-900">
                {formatCount(noSubscriptionCountRes.count ?? 0)}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="flex flex-col gap-3">
            <Link
              href="/admin/lessons/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020]"
            >
              Create a lesson
            </Link>
            <Link
              href="/admin/lessons"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Review lesson library
            </Link>
            <Link
              href="/learn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open Learning Hub
            </Link>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Recent Lesson Updates">
          {recentLessons.length === 0 ? (
            <p className="text-sm text-slate-600">No lesson updates yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentLessons.map((row) => {
                const parsed = parseLessonPayload(row.payload);
                const title =
                  parsed?.title ?? lessonTitleById.get(row.id) ?? "Untitled lesson";
                return (
                  <li key={`${row.id}:${row.updated_at}`}>
                    <Link
                      href={`/admin/lessons/${encodeURIComponent(row.id)}/edit`}
                      aria-label={`Edit lesson: ${title}`}
                      className="block rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left no-underline outline-none transition hover:border-[#84c126]/45 hover:bg-white hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{title}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.published
                              ? "bg-[#ecfccb] text-[#365314]"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {row.published ? "Live" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{formatDateTime(row.updated_at)}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {recentLessons.length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Link
                href="/admin/lessons"
                className="text-sm font-semibold text-[#5a8f1d] hover:text-[#4a7518] hover:underline"
              >
                Show more
              </Link>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Newest Learners">
          {recentLearners.length === 0 ? (
            <p className="text-sm text-slate-600">No learner profiles yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentLearners.map((row) => (
                <li
                  key={`${row.id}:${row.created_at}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {learnerName(row.username, row.id)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatSubscriptionStatus(row.subscription_status)}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-500">
                      {formatDateTime(row.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasMoreRecentLearners ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Link
                href="/admin/learners"
                className="text-sm font-semibold text-[#5a8f1d] hover:text-[#4a7518] hover:underline"
              >
                Show more
              </Link>
            </div>
          ) : null}
        </SectionCard>
      </section>
    </div>
  );
}
