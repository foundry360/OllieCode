"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ImageIcon, MoreHorizontal, Search, Star } from "lucide-react";
import {
  formatLessonDurationMinutes,
  lessonDetailHref,
  lessonPointsReward,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { LearningHubSelect } from "@/components/lms/LearningHubSelect";

type SortId =
  | "relevant"
  | "title-asc"
  | "title-desc"
  | "duration-asc"
  | "duration-desc"
  | "level-asc";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "relevant", label: "Most relevant" },
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

export function LearningHubExplore({
  lessons,
}: {
  lessons: LessonCatalogEntry[];
}) {
  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortId>("relevant");

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

  const featured = useMemo(() => lessons.slice(0, 4), [lessons]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Learning Hub
        </h1>
        <p className="mt-2 max-w-full text-base leading-relaxed text-slate-600 whitespace-nowrap overflow-x-auto [scrollbar-width:thin]">
          Browse lessons published on Ollie Code. Filter by topic and level, then open a lesson in the workspace when it is available.
        </p>
      </header>

      <section className="mt-6" aria-labelledby="popular-heading">
        <h2
          id="popular-heading"
          className="text-lg font-bold text-slate-900 sm:text-xl"
        >
          Popular lessons
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          A few highlights to start with — more are added over time.
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((lesson) => (
            <li key={lesson.id} className="h-full">
              <FeaturedLessonCard lesson={lesson} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-start">
        <aside
          className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.04] lg:w-60"
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
            <ul className="divide-y divide-slate-200">
              {results.map((lesson) => (
                <LessonResultRow key={lesson.id} lesson={lesson} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturedLessonCard({ lesson }: { lesson: LessonCatalogEntry }) {
  return (
    <article className="grid h-full min-h-[320px] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow sm:min-h-[340px]">
      <div
        className="relative flex min-h-0 items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200"
        aria-hidden
      >
        <ImageIcon
          className="size-14 text-slate-300/90"
          strokeWidth={1.25}
          aria-hidden
        />
      </div>
      <div className="flex min-h-0 flex-col border-t border-slate-100">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
          <h3 className="font-display text-lg font-bold leading-snug">
            <Link
              href={lessonDetailHref(lesson.id)}
              className="text-[#84c126] hover:text-[#6b9e1f] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
            >
              {lesson.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 sm:mt-3">
            {lesson.summary}
          </p>
        </div>
        <div className="bg-[#84c126] px-4 py-2.5 sm:px-5 sm:py-3">
          <p className="text-base font-bold text-white">
            Level {lesson.skillLevel} · {lesson.topic}
          </p>
        </div>
      </div>
    </article>
  );
}

function LessonResultRow({ lesson }: { lesson: LessonCatalogEntry }) {
  const pts = lessonPointsReward(lesson);
  const detailHref = lessonDetailHref(lesson.id);

  return (
    <li className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-x-4 py-6 first:pt-5">
      <div
        className="relative -mt-2.5 h-[100px] w-[100px] shrink-0 overflow-hidden sm:-mt-3"
        aria-hidden
      >
        <Image
          src="/images/lesson_badge.png"
          alt=""
          width={100}
          height={100}
          className="block h-full w-full -translate-y-1.5 object-cover object-top"
          sizes="100px"
        />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <Link
            href={detailHref}
            className="min-w-0 flex-1 font-display text-lg font-semibold leading-[1.15] text-[#84c126] hover:text-[#6b9e1f] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
          >
            {lesson.title}
          </Link>
          <div className="flex shrink-0 gap-0.5">
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-amber-500"
              title="Save for later"
              aria-label="Save for later"
            >
              <Star className="size-4" strokeWidth={2} />
            </button>
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
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-slate-800">
            +{pts.toLocaleString()} points
          </span>
          <span className="text-slate-500">
            {formatLessonDurationMinutes(lesson.estimatedMinutes)}
          </span>
        </div>
      </div>
    </li>
  );
}
