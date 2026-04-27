"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { LearningHubSelect } from "@/components/lms/LearningHubSelect";
import { LessonFavoriteStarButton } from "@/components/lms/LessonFavoriteStarButton";
import {
  groupLearningGuidesForHub,
  type LearningGuideListItem,
} from "@/lib/lms/learningGuides";
import {
  formatLessonDurationMinutes,
  lessonDetailHref,
  lessonHeroImageUrl,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";

type SortId =
  | "relevant"
  | "title-asc"
  | "title-desc"
  | "duration-asc"
  | "duration-desc"
  | "level-asc";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "relevant", label: "Recently updated" },
  { id: "title-asc", label: "Title A–Z" },
  { id: "title-desc", label: "Title Z–A" },
  { id: "duration-asc", label: "Shortest time" },
  { id: "duration-desc", label: "Longest time" },
  { id: "level-asc", label: "Level (low to high)" },
];

function filterAndSort(
  lessons: LessonCatalogEntry[],
  topic: string,
  objective: string,
  level: string,
  status: string,
  search: string,
  sort: SortId,
): LessonCatalogEntry[] {
  const q = search.trim().toLowerCase();
  const rows = lessons.filter((l) => {
    if (topic && l.topic !== topic) return false;
    if (objective && l.objective !== objective) return false;
    if (level && String(l.skillLevel) !== level) return false;
    if (status === "open" && !l.workspaceHref) return false;
    if (status === "soon" && l.workspaceHref) return false;
    if (q) {
      const blob = `${l.title} ${l.summary} ${l.topic} ${l.objective}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  const orderIndex = new Map(lessons.map((l, i) => [l.id, i]));

  const sorted = [...rows];
  switch (sort) {
    case "title-asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "duration-asc":
      sorted.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
      break;
    case "duration-desc":
      sorted.sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
      break;
    case "level-asc":
      sorted.sort((a, b) => a.skillLevel - b.skillLevel || a.title.localeCompare(b.title));
      break;
    default:
      sorted.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
  }
  return sorted;
}

type HubTab = "lessons" | "guides";

export function LearningHubExplore({
  lessons,
  guides,
  /** When set (signed-in user), star buttons save favorite lessons on `/profile`. */
  favoriteLessonIds,
}: {
  lessons: LessonCatalogEntry[];
  guides: readonly LearningGuideListItem[];
  favoriteLessonIds?: readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname() || "/learn";
  const searchParams = useSearchParams();
  const hubTab: HubTab =
    searchParams.get("tab") === "guides" ? "guides" : "lessons";

  const setHubTabAndUrl = useCallback(
    (t: HubTab) => {
      const q = new URLSearchParams(searchParams.toString());
      if (t === "guides") q.set("tab", "guides");
      else q.delete("tab");
      const s = q.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortId>("relevant");
  const [lessonListExpanded, setLessonListExpanded] = useState(false);

  const topicSelectId = useId();
  const objectiveSelectId = useId();
  const levelSelectId = useId();
  const statusSelectId = useId();

  const topicOptions = useMemo(
    () => Array.from(new Set(lessons.map((l) => l.topic))).sort(),
    [lessons],
  );
  const objectiveOptions = useMemo(
    () => Array.from(new Set(lessons.map((l) => l.objective))).sort(),
    [lessons],
  );
  const levelOptions = useMemo(() => {
    const nums = Array.from(new Set(lessons.map((l) => l.skillLevel))).sort(
      (a, b) => a - b,
    );
    return nums.map(String);
  }, [lessons]);

  const topicFilterOptions = useMemo(
    () => [
      { value: "", label: "All topics" },
      ...topicOptions.map((t) => ({ value: t, label: t })),
    ],
    [topicOptions],
  );
  const objectiveFilterOptions = useMemo(
    () => [
      { value: "", label: "All objectives" },
      ...objectiveOptions.map((o) => ({ value: o, label: o })),
    ],
    [objectiveOptions],
  );
  const levelFilterOptions = useMemo(
    () => [
      { value: "", label: "All levels" },
      ...levelOptions.map((lv) => ({ value: lv, label: `Level ${lv}` })),
    ],
    [levelOptions],
  );
  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "open", label: "Open in workspace" },
      { value: "soon", label: "Coming soon" },
    ],
    [],
  );
  const sortSelectOptions = useMemo(
    () =>
      SORT_OPTIONS.map((o) => ({
        value: o.id,
        label: `Sort by ${o.label}`,
      })),
    [],
  );

  const results = useMemo(
    () =>
      filterAndSort(lessons, topic, objective, level, status, search, sort),
    [lessons, topic, objective, level, status, search, sort],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setLessonListExpanded(false);
    });
  }, [topic, objective, level, status, search, sort, lessons]);

  const LIST_PREVIEW_COUNT = 5;
  const visibleListResults =
    lessonListExpanded || results.length <= LIST_PREVIEW_COUNT
      ? results
      : results.slice(0, LIST_PREVIEW_COUNT);
  const showListShowMore =
    results.length > LIST_PREVIEW_COUNT && !lessonListExpanded;
  const showListShowLess =
    results.length > LIST_PREVIEW_COUNT && lessonListExpanded;

  const featured = useMemo(() => lessons.slice(0, 10), [lessons]);

  const guideSections = useMemo(
    () => groupLearningGuidesForHub([...guides]),
    [guides],
  );

  return (
    <div className="mx-auto min-h-0 min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Learning Hub
        </h1>
        <p className="mt-2 max-w-full text-pretty text-base leading-relaxed text-slate-600">
          {hubTab === "lessons"
            ? "Browse lessons published on Ollie Code. Filter by topic and level, then open a lesson in the workspace when it is available."
            : "Short reads for families and learners, tips, getting started, and how to make the most of Ollie Code."}
        </p>
      </header>

      <div
        className="mt-6 flex flex-wrap gap-8 border-b border-slate-200 sm:gap-10"
        role="tablist"
        aria-label="Learning Hub sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={hubTab === "lessons"}
          id="hub-tab-lessons"
          aria-controls="hub-panel-lessons"
          onClick={() => setHubTabAndUrl("lessons")}
          className={
            hubTab === "lessons"
              ? "-mb-px border-b-[4px] border-[#84c126] pb-3 text-sm font-bold text-slate-900"
              : "-mb-px border-b-[4px] border-transparent pb-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          }
        >
          Starter Lessons
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={hubTab === "guides"}
          id="hub-tab-guides"
          aria-controls="hub-panel-guides"
          onClick={() => setHubTabAndUrl("guides")}
          className={
            hubTab === "guides"
              ? "-mb-px border-b-[4px] border-[#84c126] pb-3 text-sm font-bold text-slate-900"
              : "-mb-px border-b-[4px] border-transparent pb-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          }
        >
          Learning Guides
        </button>
      </div>

      {hubTab === "lessons" ? (
        <>
          <section
            className="mt-6"
            id="hub-panel-lessons"
            role="tabpanel"
            aria-labelledby="hub-tab-lessons"
          >
            <h2
              id="popular-heading"
              className="text-lg font-bold text-slate-900 sm:text-xl"
            >
              Popular lessons
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Start with these fun lessons, then explore even more below!
            </p>
            <PopularLessonsCarousel lessons={featured} />
          </section>

          <div className="mt-12 flex min-w-0 max-w-full flex-col gap-10 lg:flex-row lg:items-start">
        <aside
          className="w-full min-w-0 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.04] lg:w-60"
          aria-labelledby="filter-heading"
        >
          <h3
            id="filter-heading"
            className="font-display text-base font-bold text-slate-900"
          >
            Filter
          </h3>
          <div className="mt-4 flex flex-col gap-4">
            <label className="block" htmlFor={topicSelectId}>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
                Topic
              </span>
              <LearningHubSelect
                id={topicSelectId}
                value={topic}
                onChange={setTopic}
                options={topicFilterOptions}
              />
            </label>
            <label className="block" htmlFor={objectiveSelectId}>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
                Objective
              </span>
              <LearningHubSelect
                id={objectiveSelectId}
                value={objective}
                onChange={setObjective}
                options={objectiveFilterOptions}
              />
            </label>
            <label className="block" htmlFor={levelSelectId}>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
                Level
              </span>
              <LearningHubSelect
                id={levelSelectId}
                value={level}
                onChange={setLevel}
                options={levelFilterOptions}
              />
            </label>
            <label className="block" htmlFor={statusSelectId}>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
                Availability
              </span>
              <LearningHubSelect
                id={statusSelectId}
                value={status}
                onChange={setStatus}
                options={statusFilterOptions}
              />
            </label>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
              <p className="shrink-0 text-sm font-semibold text-slate-800">
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {results.length}
                </span>{" "}
                result{results.length === 1 ? "" : "s"}
              </p>
              <div className="relative min-w-0 w-full sm:max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Quick search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 shadow-sm outline-none ring-1 ring-slate-900/[0.04] placeholder:text-slate-400 transition hover:border-[#84c126]/50 hover:bg-[#f8fafc] focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25"
                  aria-label="Search lessons"
                />
              </div>
            </div>
            <div className="sm:min-w-[200px]">
              <LearningHubSelect
                value={sort}
                onChange={(v) => setSort(v as SortId)}
                options={sortSelectOptions}
                aria-label="Sort lesson list"
              />
            </div>
          </div>

          {results.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-600">
              No lessons match these filters. Try clearing a filter or search.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-slate-200">
                {visibleListResults.map((lesson) => (
                  <LessonResultRow
                    key={lesson.id}
                    lesson={lesson}
                    favoriteLessonIds={favoriteLessonIds}
                  />
                ))}
              </ul>
              {showListShowMore || showListShowLess ? (
                <div className="border-t border-slate-200 pt-4">
                  {showListShowMore ? (
                    <button
                      type="button"
                      onClick={() => setLessonListExpanded(true)}
                      className="text-sm font-semibold text-[#84c126] no-underline transition hover:text-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                    >
                      Show More
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLessonListExpanded(false)}
                      className="text-sm font-semibold text-[#84c126] no-underline transition hover:text-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                    >
                      Show Less
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
        </>
      ) : (
        <section
          className="mt-8 space-y-8"
          id="hub-panel-guides"
          role="tabpanel"
          aria-labelledby="hub-tab-guides"
        >
          {guideSections.map(({ section, guides: secGuides }) => (
            <div key={section}>
              <h2 className="font-section text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {section}
              </h2>
              {secGuides.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No guides here yet.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {secGuides.map((g) => (
                    <li key={g.id}>
                      <LearningGuideCard guide={g} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function LearningGuideCard({ guide }: { guide: LearningGuideListItem }) {
  const hero = guide.cardImageUrl?.trim() || null;
  const href = `/learn/guides/${encodeURIComponent(guide.id)}`;
  return (
    <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow">
      <Link
        href={href}
        className="flex min-h-0 w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
      >
        <div
          className="relative aspect-[16/9] w-full shrink-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200"
          aria-hidden
        >
          {hero ? (
            <Image
              src={hero}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 639px) 42vw, (max-width: 767px) 28vw, (max-width: 1023px) 22vw, 18vw"
            />
          ) : (
            <div className="flex h-full min-h-[52px] items-center justify-center">
              <ImageIcon
                className="relative z-0 size-8 text-slate-300/90"
                strokeWidth={1.25}
                aria-hidden
              />
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 px-2.5 py-2 sm:px-3 sm:py-2.5">
          <h3 className="font-section text-xs font-bold leading-snug text-[#84c126] sm:text-[13px]">
            <span className="line-clamp-2">{guide.title}</span>
          </h3>
        </div>
      </Link>
    </article>
  );
}

const CAROUSEL_GAP_PX = 16;

/** Max slides per viewport row (matches Tailwind sm/lg in {@link visibleColumnsForWidth}). */
const CAROUSEL_MAX_COLUMNS = 5;

/**
 * When the catalog has this many lessons or fewer, repeating the strip for an infinite
 * loop would show the same lesson in multiple columns at once — use a single run instead.
 */
function loopSegmentCount(lessonCount: number): number {
  return lessonCount > CAROUSEL_MAX_COLUMNS ? 3 : 1;
}

/** How many equal-width slides fit in the viewport at this width (matches Tailwind sm/lg). */
function visibleColumnsForWidth(width: number): number {
  if (width >= 1024) return 5;
  if (width >= 640) return 2;
  return 1;
}

function PopularLessonsCarousel({ lessons }: { lessons: LessonCatalogEntry[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cardBasisPx, setCardBasisPx] = useState(0);
  const loopSegments = loopSegmentCount(lessons.length);

  const loopSlides = useMemo(
    () =>
      Array.from({ length: loopSegments }, (_, copy) => copy).flatMap((copy) =>
        lessons.map((lesson) => ({
          lesson,
          loopKey: `${lesson.id}__${copy}`,
        })),
      ),
    [lessons, loopSegments],
  );

  const normalizeLoopScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || lessons.length <= 1 || loopSegments <= 1) return;
    const seg = el.scrollWidth / loopSegments;
    if (seg <= 0 || el.scrollWidth <= el.clientWidth + 1) return;
    const left = el.scrollLeft;
    // First copy (near track start): jump forward one segment into the middle copy.
    if (left < 8) {
      el.scrollTo({ left: left + seg, behavior: "auto" });
      return;
    }
    // Third copy (scroll position past the start of that segment): jump back one segment.
    if (left + 1e-3 >= 2 * seg) {
      el.scrollTo({ left: left - seg, behavior: "auto" });
    }
  }, [lessons.length, loopSegments]);

  const alignLoopToMiddleSegment = useCallback(() => {
    const el = viewportRef.current;
    if (!el || lessons.length <= 1) return;
    if (loopSegments <= 1) {
      el.scrollTo({ left: 0, behavior: "auto" });
      return;
    }
    const seg = el.scrollWidth / loopSegments;
    if (seg <= 0 || el.scrollWidth <= el.clientWidth + 1) return;
    el.scrollTo({ left: seg, behavior: "auto" });
  }, [lessons.length, loopSegments]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateBasis = () => {
      const w = el.clientWidth;
      const cols = visibleColumnsForWidth(w);
      const basis = (w - (cols - 1) * CAROUSEL_GAP_PX) / cols;
      setCardBasisPx(Math.max(0, basis));
    };

    updateBasis();
    const ro = new ResizeObserver(updateBasis);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [lessons]);

  /** After slide widths / triple strip layout updates, sit on the middle copy (same view as start, endless forward). */
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      alignLoopToMiddleSegment();
      requestAnimationFrame(alignLoopToMiddleSegment);
    });
    return () => cancelAnimationFrame(id);
  }, [lessons, cardBasisPx, alignLoopToMiddleSegment]);

  /** Paged scroll; loop strip repositions in onScroll so 1 → 2 → … → n → 1 → 2 … without reversing. */
  const scrollByDir = (dir: -1 | 1) => {
    const el = viewportRef.current;
    if (!el || lessons.length <= 1) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const cycleDisabled = lessons.length <= 1;

  if (lessons.length === 0) return null;

  const slideStyle: CSSProperties =
    cardBasisPx > 0
      ? {
          flex: `0 0 ${cardBasisPx}px`,
          width: cardBasisPx,
          minWidth: cardBasisPx,
          maxWidth: cardBasisPx,
        }
      : {
          flex: "0 0 min(85vw, 300px)",
          width: "min(85vw, 300px)",
          minWidth: "min(85vw, 300px)",
          maxWidth: "min(85vw, 300px)",
        };

  return (
    <div className="group relative mt-5 min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        disabled={cycleDisabled}
        className="pointer-events-none absolute left-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-0 text-slate-700 opacity-0 shadow-md ring-1 ring-slate-900/5 backdrop-blur-sm transition-[opacity,box-shadow,colors] duration-200 hover:bg-white hover:text-[#3f6212] group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-25"
        aria-label="Previous popular lessons"
      >
        <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => scrollByDir(1)}
        disabled={cycleDisabled}
        className="pointer-events-none absolute right-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-0 text-slate-700 opacity-0 shadow-md ring-1 ring-slate-900/5 backdrop-blur-sm transition-[opacity,box-shadow,colors] duration-200 hover:bg-white hover:text-[#3f6212] group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-25"
        aria-label="Next popular lessons"
      >
        <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
      </button>

      <div
        ref={viewportRef}
        onScroll={normalizeLoopScroll}
        className="max-w-full min-w-0 overflow-x-auto overflow-y-visible pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0"
      >
        <ul
          role="list"
          className="flex snap-x snap-mandatory items-stretch gap-4"
        >
          {loopSlides.map(({ lesson, loopKey }) => (
            <li
              key={loopKey}
              data-carousel-item
              className="h-full min-w-0 snap-start"
              style={slideStyle}
            >
              <FeaturedLessonCard lesson={lesson} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FeaturedLessonCard({ lesson }: { lesson: LessonCatalogEntry }) {
  const hero = lessonHeroImageUrl(lesson);
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow">
      <div
        className="relative flex min-h-[160px] shrink-0 items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 sm:min-h-[180px]"
        aria-hidden
      >
        {hero ? (
          <Image
            src={hero}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 639px) 85vw, (max-width: 1023px) 45vw, 20vw"
          />
        ) : (
          <ImageIcon
            className="relative z-0 size-14 text-slate-300/90"
            strokeWidth={1.25}
            aria-hidden
          />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
          <h3 className="min-w-0 font-display text-lg font-bold capitalize leading-snug">
            <Link
              href={lessonDetailHref(lesson.id)}
              title={lesson.title}
              className="block truncate text-[#84c126] no-underline hover:text-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
            >
              {lesson.title}
            </Link>
          </h3>
          <p className="mt-2 min-h-[2lh] line-clamp-2 text-sm leading-relaxed text-slate-600 sm:mt-3">
            {lesson.summary}
          </p>
        </div>
        <div className="shrink-0 bg-[#84c126] px-4 py-2.5 sm:px-5 sm:py-3">
          <p className="text-base font-bold text-white">
            Level {lesson.skillLevel} · {lesson.topic}
          </p>
        </div>
      </div>
    </article>
  );
}

function LessonResultRow({
  lesson,
  favoriteLessonIds,
}: {
  lesson: LessonCatalogEntry;
  favoriteLessonIds?: readonly string[];
}) {
  const detailHref = lessonDetailHref(lesson.id);
  const hero = lessonHeroImageUrl(lesson);

  return (
    <li className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-x-4 py-6 first:pt-5">
      <div
        className="relative -mt-2.5 h-[100px] w-[100px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:-mt-3"
        aria-hidden
      >
        {hero ? (
          <Image
            src={hero}
            alt=""
            width={100}
            height={100}
            className="block h-full w-full object-cover"
            sizes="100px"
          />
        ) : (
          <Image
            src="/images/lesson_badge.png"
            alt=""
            width={100}
            height={100}
            className="block h-full w-full -translate-y-1.5 object-cover object-top"
            sizes="100px"
          />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <Link
            href={detailHref}
            title={lesson.title}
            className="min-w-0 flex-1 truncate font-display text-lg font-semibold capitalize leading-[1.15] text-[#84c126] no-underline hover:text-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
          >
            {lesson.title}
          </Link>
          <div className="flex shrink-0 gap-0.5">
            {favoriteLessonIds !== undefined ? (
              <LessonFavoriteStarButton
                lessonId={lesson.id}
                initialFavorited={favoriteLessonIds.includes(lesson.id)}
              />
            ) : null}
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="More actions"
              aria-label="More actions"
            >
              <MoreHorizontal className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {lesson.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm tabular-nums">
          <span className="text-slate-500">
            {formatLessonDurationMinutes(lesson.estimatedMinutes)}
          </span>
        </div>
      </div>
    </li>
  );
}
