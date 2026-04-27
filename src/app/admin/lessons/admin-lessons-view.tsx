"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Pencil,
  Table2,
} from "lucide-react";
import { LearningHubSelect } from "@/components/lms/LearningHubSelect";

export type LessonAdminRow = {
  id: string;
  title: string;
  published: boolean;
  imageUrl: string | null;
  topic: string | null;
};

const STORAGE_KEY = "ollie-admin-lessons-view";
const FILTER_STORAGE_KEY = "ollie-admin-lessons-filter-status";
const TOPIC_FILTER_STORAGE_KEY = "ollie-admin-lessons-filter-topic";

type ViewMode = "table" | "cards";

type StatusFilter = "all" | "live" | "draft";

type TableSortKey = "id" | "title" | "published";

function SortableColumnHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: TableSortKey;
  sort: { key: TableSortKey; dir: "asc" | "desc" };
  onSort: (key: TableSortKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      className="px-4 py-3"
      aria-sort={
        active
          ? sort.dir === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded-md -mx-1 px-1 py-0.5 text-left hover:bg-slate-200/60 hover:text-slate-800"
      >
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ChevronUp className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="size-3.5 shrink-0" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}

/** Fixed columns for lesson cards — used to cap card grid to 3 rows. */
const ADMIN_LESSON_GRID_COLUMNS = 6;

const CARD_PREVIEW_ROWS = 3;

export function AdminLessonsView({ rows }: { rows: LessonAdminRow[] }) {
  const [view, setView] = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState("");
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [tableSort, setTableSort] = useState<{
    key: TableSortKey;
    dir: "asc" | "desc";
  }>({ key: "title", dir: "asc" });

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "cards" || v === "table") setView(v);
      const f = localStorage.getItem(FILTER_STORAGE_KEY);
      if (f === "all" || f === "live" || f === "draft") {
        setStatusFilter(f);
      } else if (f === "catalog_only") {
        setStatusFilter("all");
      }
      const t = localStorage.getItem(TOPIC_FILTER_STORAGE_KEY);
      if (t !== null) setTopicFilter(t);
    } catch {
      /* ignore */
    }
  }, []);

  const topicOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.topic?.trim()) set.add(r.topic.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "live", label: "Live" },
      { value: "draft", label: "Draft" },
    ],
    [],
  );

  const topicFilterSelectOptions = useMemo(
    () => [
      { value: "", label: "All topics" },
      ...topicOptions.map((t) => ({ value: t, label: t })),
    ],
    [topicOptions],
  );

  const filteredRows = useMemo(() => {
    let list = rows;
    switch (statusFilter) {
      case "live":
        list = list.filter((r) => r.published === true);
        break;
      case "draft":
        list = list.filter((r) => r.published === false);
        break;
      default:
        break;
    }
    if (topicFilter.trim()) {
      list = list.filter((r) => r.topic === topicFilter);
    }
    return list;
  }, [rows, statusFilter, topicFilter]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    const mult = tableSort.dir === "asc" ? 1 : -1;
    const publishedRank = (p: boolean) => (p ? 1 : 0);

    list.sort((a, b) => {
      switch (tableSort.key) {
        case "id":
          return (
            a.id.localeCompare(b.id, undefined, { sensitivity: "base" }) * mult
          );
        case "title":
          return (
            a.title.localeCompare(b.title, undefined, {
              sensitivity: "base",
            }) * mult
          );
        case "published":
          return (
            (publishedRank(a.published) - publishedRank(b.published)) * mult
          );
        default:
          return 0;
      }
    });
    return list;
  }, [filteredRows, tableSort]);

  const filteredRowsKey = useMemo(
    () =>
      `${statusFilter}:${topicFilter}:${filteredRows.map((r) => r.id).join(",")}`,
    [statusFilter, topicFilter, filteredRows],
  );

  useEffect(() => {
    setCardsExpanded(false);
  }, [filteredRowsKey]);

  const cardPreviewLimit = Math.max(
    1,
    ADMIN_LESSON_GRID_COLUMNS * CARD_PREVIEW_ROWS,
  );
  const showCardShowMore =
    view === "cards" &&
    filteredRows.length > cardPreviewLimit &&
    !cardsExpanded;
  const showCardShowLess =
    view === "cards" &&
    filteredRows.length > cardPreviewLimit &&
    cardsExpanded;
  const visibleCardRows =
    cardsExpanded || sortedRows.length <= cardPreviewLimit
      ? sortedRows
      : sortedRows.slice(0, cardPreviewLimit);

  const setMode = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const setStatus = (next: StatusFilter) => {
    setStatusFilter(next);
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const setTopic = (next: string) => {
    setTopicFilter(next);
    try {
      localStorage.setItem(TOPIC_FILTER_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const cycleTableSort = (key: TableSortKey) => {
    setTableSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {filteredRows.length === rows.length
            ? `${rows.length} lesson${rows.length === 1 ? "" : "s"}`
            : `${filteredRows.length} of ${rows.length} lesson${
                rows.length === 1 ? "" : "s"
              }`}
        </span>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
          <div className="w-full min-w-0 sm:w-52 sm:shrink-0">
            <LearningHubSelect
              value={statusFilter}
              onChange={(v) => {
                if (v === "all" || v === "live" || v === "draft") {
                  setStatus(v);
                }
              }}
              options={statusFilterOptions}
              aria-label="Filter by publish status"
            />
          </div>
          {topicOptions.length > 0 ? (
            <div className="w-full min-w-0 sm:w-52 sm:shrink-0">
              <LearningHubSelect
                value={topicFilter}
                onChange={setTopic}
                options={topicFilterSelectOptions}
                aria-label="Filter by topic"
              />
            </div>
          ) : null}
          <div
            className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
            role="group"
            aria-label="Layout"
          >
            <button
              type="button"
              onClick={() => setMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === "table"
                  ? "bg-[#ecfccb] text-[#365314] ring-1 ring-[#84c126]/40"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              aria-pressed={view === "table"}
            >
              <Table2 className="size-3.5" strokeWidth={2} aria-hidden />
              Table
            </button>
            <button
              type="button"
              onClick={() => setMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === "cards"
                  ? "bg-[#ecfccb] text-[#365314] ring-1 ring-[#84c126]/40"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              aria-pressed={view === "cards"}
            >
              <LayoutGrid className="size-3.5" strokeWidth={2} aria-hidden />
              Cards
            </button>
          </div>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-slate-600">
          No lessons match these filters. Try choosing &quot;All statuses&quot; or
          &quot;All topics&quot;.
        </p>
      ) : view === "table" ? (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <SortableColumnHeader
                label="Lesson id"
                sortKey="id"
                sort={tableSort}
                onSort={cycleTableSort}
              />
              <SortableColumnHeader
                label="Title"
                sortKey="title"
                sort={tableSort}
                onSort={cycleTableSort}
              />
              <SortableColumnHeader
                label="Published"
                sortKey="published"
                sort={tableSort}
                onSort={cycleTableSort}
              />
              <th className="px-4 py-3" scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => (
              <tr key={row.id} className="group hover:bg-slate-50/80">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {row.id}
                </td>
                <td className="px-4 py-3 font-medium capitalize text-slate-900">
                  {row.title}
                </td>
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
                <td className="px-4 py-3 text-right align-middle">
                  <Link
                    href={`/admin/lessons/${encodeURIComponent(row.id)}/basics`}
                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 opacity-0 transition-opacity hover:bg-slate-200/60 hover:text-[#84c126] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84c126] group-hover:opacity-100"
                    aria-label={`Edit ${row.title}`}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            {visibleCardRows.map((row) => (
              <article
                key={row.id}
                className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <Link
                  href={`/admin/lessons/${encodeURIComponent(row.id)}/basics`}
                  className="absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-lg bg-white/95 p-2 text-slate-600 opacity-0 shadow-md ring-1 ring-slate-200/80 transition-opacity hover:bg-white hover:text-[#84c126] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84c126] group-hover:opacity-100"
                  aria-label={`Edit ${row.title}`}
                >
                  <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                </Link>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  {row.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- lesson URLs may be any host
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[120px] items-center justify-center text-xs font-medium text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  {row.topic ? (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {row.topic}
                    </p>
                  ) : null}
                  <h2
                    className="min-w-0 truncate font-display text-base font-bold capitalize leading-snug text-slate-900"
                    title={row.title}
                  >
                    {row.title}
                  </h2>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                    <div className="min-w-0 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">
                        Published:
                      </span>{" "}
                      <span
                        className={
                          row.published
                            ? "rounded-full bg-[#ecfccb] px-2 py-0.5 text-xs font-semibold text-[#365314]"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                        }
                      >
                        {row.published ? "Live" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {showCardShowMore ? (
            <div className="mt-4 flex justify-center border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setCardsExpanded(true)}
                className="text-sm font-semibold text-[#84c126] hover:underline"
              >
                Show more
              </button>
            </div>
          ) : null}
          {showCardShowLess ? (
            <div className="mt-4 flex justify-center border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setCardsExpanded(false)}
                className="text-sm font-semibold text-[#84c126] hover:underline"
              >
                Show less
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
