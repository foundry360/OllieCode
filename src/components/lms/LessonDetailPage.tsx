import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ChevronDown,
  Clock,
  Share2,
  Star,
  Trophy,
  User,
} from "lucide-react";
import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { Footer } from "@/components/landing/Footer";
import DOMPurify from "isomorphic-dompurify";
import {
  formatLessonDurationMinutes,
  lessonPointsReward,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";

type LessonDetailPageProps = {
  lesson: LessonCatalogEntry;
};

function formatModuleDuration(mins: number): string {
  if (mins <= 0) return "—";
  if (mins < 60) return `~${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h} hr ${m} mins` : `~${h} hrs`;
}

export function LessonDetailPage({ lesson }: LessonDetailPageProps) {
  const canStart = Boolean(lesson.workspaceHref);
  const totalPoints = lessonPointsReward(lesson);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc] text-slate-900">
      <SignedInAppHeader active="learn" tone="learn" />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <p className="mb-6">
            <Link
              href="/learn"
              className="text-sm font-semibold text-[#84c126] hover:underline"
            >
              ← Learning Hub
            </Link>
          </p>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            {/* Sidebar card */}
            <aside className="w-full shrink-0 lg:max-w-[380px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                <div className="relative rounded-t-2xl bg-gradient-to-b from-slate-800 to-slate-900 pb-12 pt-8">
                  <div className="relative flex justify-center">
                    <div className="relative h-[100px] w-[100px] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg ring-2 ring-white/20">
                      <Image
                        src="/images/lesson_badge.png"
                        alt=""
                        width={100}
                        height={100}
                        className="h-full w-full object-cover object-top"
                        sizes="100px"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 px-5 pb-6 pt-2">
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Lesson
                  </span>
                  <h1 className="font-display text-2xl font-bold leading-tight text-slate-900">
                    {lesson.title}
                  </h1>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {lesson.summary}
                  </p>
                  <div className="flex flex-col gap-3 pt-2">
                    {canStart && lesson.workspaceHref ? (
                      <Link
                        href={lesson.workspaceHref}
                        className="flex w-full items-center justify-center rounded-xl bg-[#84c126] px-4 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                      >
                        Start
                      </Link>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-500">
                        Coming soon in the workspace
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#84c126] bg-white px-3 py-2.5 text-sm font-semibold text-[#3f6212] transition hover:bg-[#ecfccb]"
                        aria-label="Save for later"
                      >
                        <Star className="size-4" strokeWidth={2} />
                        Favorite
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#84c126] bg-white px-3 py-2.5 text-sm font-semibold text-[#3f6212] transition hover:bg-[#ecfccb]"
                        aria-label="Share"
                      >
                        <Share2 className="size-4" strokeWidth={2} />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main column */}
            <div className="min-w-0 flex-1 space-y-8">
              <div className="flex flex-wrap items-stretch justify-center gap-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100/90 px-2 py-3 text-sm sm:justify-between sm:px-4">
                <StatItem
                  icon={<Trophy className="size-4 text-[#84c126]" strokeWidth={2} />}
                  label={
                    <>
                      +{totalPoints.toLocaleString()} points
                    </>
                  }
                />
                <div className="hidden w-px bg-slate-300 sm:block" aria-hidden />
                <StatItem
                  icon={<BarChart3 className="size-4 text-[#84c126]" strokeWidth={2} />}
                  label={lesson.levelName}
                />
                <div className="hidden w-px bg-slate-300 sm:block" aria-hidden />
                <StatItem
                  icon={<User className="size-4 text-[#84c126]" strokeWidth={2} />}
                  label={lesson.roleLabel}
                />
                <div className="hidden w-px bg-slate-300 sm:block" aria-hidden />
                <StatItem
                  icon={<Clock className="size-4 text-[#84c126]" strokeWidth={2} />}
                  label={formatLessonDurationMinutes(lesson.estimatedMinutes)}
                />
              </div>

              {!isTrivialLessonHtml(lesson.bodyHtml) ? (
                <section
                  aria-label="Lesson overview"
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div
                    className="lesson-body-html max-w-none text-sm leading-relaxed text-slate-700 [&_a]:font-semibold [&_a]:text-[#84c126] [&_a]:underline [&_h2]:mt-0 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(lesson.bodyHtml ?? "", {
                        ADD_ATTR: ["target", "rel"],
                      }),
                    }}
                  />
                </section>
              ) : null}

              <section aria-labelledby="modules-heading">
                <h2
                  id="modules-heading"
                  className="font-display text-lg font-bold text-slate-900"
                >
                  Modules
                </h2>
                <ol className="relative mt-6 border-l border-slate-300 pl-8">
                  {lesson.modules.map((mod) => (
                    <li key={mod.id} className="relative mb-6 last:mb-0">
                      <span
                        className="absolute -left-[21px] top-3 flex h-3 w-3 rounded-full border-2 border-white bg-slate-400 ring-2 ring-slate-200"
                        aria-hidden
                      />
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {mod.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                          <span>
                            {mod.points > 0
                              ? `+${mod.points.toLocaleString()} points`
                              : "—"}
                          </span>
                          <span>
                            {formatModuleDuration(mod.durationMins)}
                            {mod.steps > 0 ? ` • ${mod.steps} steps` : ""}
                          </span>
                        </div>
                        <details className="group mt-3 border-t border-slate-100 pt-3">
                          <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-[#84c126] hover:underline [&::-webkit-details-marker]:hidden">
                            Show details
                            <ChevronDown className="size-4 transition group-open:rotate-180" />
                          </summary>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {mod.detail}
                          </p>
                        </details>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col items-center gap-1 px-2 text-center sm:flex-row sm:justify-center sm:gap-2 sm:text-left">
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="font-semibold text-slate-800">{label}</span>
    </div>
  );
}
