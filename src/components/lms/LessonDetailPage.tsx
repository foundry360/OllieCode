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
import {
  formatLessonDurationMinutes,
  formatModuleDurationMinutes,
  formatPointsLabel,
  formatStepCountLabel,
  lessonHeroImageUrl,
  lessonPointsReward,
  normalizeWorkspaceHrefWithLesson,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { embellishLessonColorWords } from "@/lib/lms/embellishLessonColorWords";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";
import { DiscoverMoreSection } from "@/components/lms/DiscoverMoreSection";
import { LessonModuleDetailsAccordion } from "@/components/lms/LessonModuleDetailsAccordion";

type LessonDetailPageProps = {
  lesson: LessonCatalogEntry;
  discoverMoreLessons?: LessonCatalogEntry[];
};

const lessonBodyProseClass =
  "lesson-body-html max-w-none text-sm leading-relaxed text-slate-700 [&_a]:font-semibold [&_a]:text-[#84c126] [&_a]:no-underline hover:[&_a]:text-[#6b9e1f] [&_h2]:mt-0 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5";

export function LessonDetailPage({
  lesson,
  discoverMoreLessons = [],
}: LessonDetailPageProps) {
  const activateWorkspaceHref = normalizeWorkspaceHrefWithLesson(
    lesson.workspaceHref,
    lesson.id,
  );
  const canActivate = Boolean(activateWorkspaceHref);
  const totalPoints = lessonPointsReward(lesson);
  const hero = lessonHeroImageUrl(lesson);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc] text-slate-900">
      <SignedInAppHeader active="learn" tone="learn" />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <p className="mb-8">
            <Link
              href="/learn"
              className="text-sm font-semibold text-[#84c126] no-underline hover:text-[#6b9e1f]"
            >
              ← Learning Hub
            </Link>
          </p>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            {/* Left: card art + Activate */}
            <aside className="w-full shrink-0 lg:max-w-[400px] lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
                  {hero ? (
                    // eslint-disable-next-line @next/next/no-img-element -- lesson URLs may be any host (hub uses same)
                    <img
                      src={hero}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[160px] items-center justify-center">
                      <Image
                        src="/images/lesson_badge.png"
                        alt=""
                        width={120}
                        height={120}
                        className="object-contain opacity-90"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-5">
                  {canActivate && activateWorkspaceHref ? (
                    <Link
                      href={activateWorkspaceHref}
                      className="flex w-full items-center justify-center rounded-xl bg-[#84c126] px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                    >
                      Activate lesson
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
            </aside>

            {/* Right: stats, overview, modules */}
            <div className="min-w-0 flex-1 space-y-8">
              <div className="flex flex-wrap items-stretch justify-center gap-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100/90 px-2 py-3 text-sm sm:justify-between sm:px-4">
                <StatItem
                  icon={<Trophy className="size-4 text-[#84c126]" strokeWidth={2} />}
                  label={formatPointsLabel(totalPoints)}
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

              <div>
                <h1 className="font-display text-3xl font-bold capitalize leading-tight text-slate-900 sm:text-4xl">
                  {lesson.title}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
                  {lesson.summary}
                </p>
              </div>

              {!isTrivialLessonHtml(lesson.bodyHtml) ? (
                <section
                  aria-label="Lesson overview"
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Overview
                  </h2>
                  <div
                    className={`${lessonBodyProseClass} mt-3`}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeLessonBodyHtml(
                        embellishLessonColorWords(lesson.bodyHtml),
                      ),
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
                <p className="mt-1 text-sm text-slate-600">
                  Follow each step below, then use{" "}
                  <strong className="font-semibold text-slate-800">
                    Activate lesson
                  </strong>{" "}
                  when you’re ready to build in the workspace.
                </p>
                <div className="relative mt-6">
                  {/* Rail: centered on the step column (w-16 → midpoint left-8) */}
                  <div
                    className="pointer-events-none absolute bottom-4 left-8 top-4 w-px -translate-x-1/2 bg-slate-300"
                    aria-hidden
                  />
                  <ol className="relative m-0 list-none space-y-8 p-0">
                    {lesson.modules.map((mod, i) => (
                      <li
                        key={mod.id}
                        className="relative flex gap-5 sm:gap-6"
                      >
                        <div className="relative z-[1] flex w-16 shrink-0 justify-center">
                          <span
                            className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#f8fafc] bg-[#84c126] text-lg font-bold tabular-nums leading-none text-white shadow-md ring-2 ring-[#ecfccb]"
                            aria-hidden
                          >
                            {i + 1}
                          </span>
                        </div>
                        <LessonModuleDetailsAccordion
                          defaultOpen={i === 0}
                          summary={
                            <summary className="block cursor-pointer list-none px-5 py-5 transition-colors hover:bg-slate-50/90 sm:px-6 sm:py-6 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2">
                              <h3 className="font-display text-xl font-bold capitalize leading-snug text-slate-900 sm:text-2xl">
                                {mod.title}
                              </h3>
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm font-medium text-slate-500">
                                <span className="tabular-nums">
                                  {mod.points > 0
                                    ? formatPointsLabel(mod.points)
                                    : "—"}
                                </span>
                                <span className="tabular-nums">
                                  {formatModuleDurationMinutes(mod.durationMins)}
                                  {formatStepCountLabel(mod.steps)
                                    ? ` · ${formatStepCountLabel(mod.steps)}`
                                    : ""}
                                </span>
                              </div>
                              <span className="mt-3 inline-flex items-center gap-1.5 text-base font-semibold text-[#84c126] transition hover:text-[#6b9e1f] group-open:hidden">
                                Show Details
                                <ChevronDown
                                  className="size-4 shrink-0"
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                              </span>
                              <span className="mt-3 hidden items-center gap-1.5 text-base font-semibold text-[#84c126] group-open:inline-flex hover:text-[#6b9e1f]">
                                Hide Details
                                <ChevronDown
                                  className="size-4 shrink-0 rotate-180"
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                              </span>
                            </summary>
                          }
                        >
                          <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                            {!isTrivialLessonHtml(mod.detail) ? (
                              <div
                                className={lessonBodyProseClass}
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeLessonBodyHtml(
                                    embellishLessonColorWords(mod.detail),
                                  ),
                                }}
                              />
                            ) : null}
                          </div>
                        </LessonModuleDetailsAccordion>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            </div>
          </div>

          <DiscoverMoreSection lessons={discoverMoreLessons} />
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
      <span className="font-semibold tabular-nums text-slate-800">{label}</span>
    </div>
  );
}
