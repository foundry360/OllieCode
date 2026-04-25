"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PanelSelect, PanelSelectGroup } from "@/components/ui/panel-select";
import { getAvatarBySlug } from "@/lib/profiles/avatarAssets";

export type LearnerTableRow = {
  id: string;
  username: string | null;
  created_at: string;
  subscription_status: string;
  is_admin: boolean;
  avatar_slug: string | null;
  /** Parent/guardian email from signup approval or family master (when stored). */
  parent_email: string | null;
  /** From auth.users via admin view; null if unavailable or never signed in. */
  last_sign_in_at: string | null;
};

const SUBSCRIPTION_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "none", label: "No subscription" },
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
  { value: "paused", label: "Paused" },
  { value: "unpaid", label: "Unpaid" },
  { value: "incomplete", label: "Incomplete" },
  { value: "incomplete_expired", label: "Incomplete expired" },
] as const;

const ADMIN_FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "learner", label: "Learners only" },
  { value: "admin", label: "Admins only" },
] as const;

type SortKey = "display" | "id" | "subscription_status" | "is_admin" | "created_at" | "last_sign_in_at";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "display", label: "Learner" },
  { value: "id", label: "User id" },
  { value: "subscription_status", label: "Subscription" },
  { value: "is_admin", label: "Admin" },
  { value: "created_at", label: "Joined" },
  { value: "last_sign_in_at", label: "Last signed in" },
];

const PAGE_SIZE_OPTIONS = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "75", label: "75" },
  { value: "100", label: "100" },
] as const;

type PageSize = 25 | 50 | 75 | 100;

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
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

function compareStrings(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

function compareBooleans(a: boolean, b: boolean, dir: SortDir): number {
  const av = a ? 1 : 0;
  const bv = b ? 1 : 0;
  const cmp = av - bv;
  return dir === "asc" ? cmp : -cmp;
}

function compareDates(a: string, b: string, dir: SortDir): number {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  const cmp = (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
  return dir === "asc" ? cmp : -cmp;
}

/** Null / invalid dates sort last in both directions. */
function compareDatesNullable(a: string | null, b: string | null, dir: SortDir): number {
  const ta = a && !Number.isNaN(new Date(a).getTime()) ? new Date(a).getTime() : null;
  const tb = b && !Number.isNaN(new Date(b).getTime()) ? new Date(b).getTime() : null;
  if (ta === null && tb === null) return 0;
  if (ta === null) return 1;
  if (tb === null) return -1;
  const cmp = ta - tb;
  return dir === "asc" ? cmp : -cmp;
}

export function LearnersTable({ rows }: Readonly<{ rows: LearnerTableRow[] }>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [adminFilter, setAdminFilter] = useState<(typeof ADMIN_FILTERS)[number]["value"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.map((r) => ({
      ...r,
      is_admin: Boolean(r.is_admin),
      avatar_slug: typeof r.avatar_slug === "string" ? r.avatar_slug : null,
      parent_email:
        typeof r.parent_email === "string" && r.parent_email.trim()
          ? r.parent_email.trim()
          : null,
      last_sign_in_at:
        typeof r.last_sign_in_at === "string" && r.last_sign_in_at.trim() && !Number.isNaN(Date.parse(r.last_sign_in_at))
          ? new Date(r.last_sign_in_at).toISOString()
          : null,
    }));

    if (q) {
      list = list.filter((r) => {
        const name = learnerName(r.username, r.id).toLowerCase();
        const sub = formatSubscriptionStatus(r.subscription_status).toLowerCase();
        const parent = (r.parent_email ?? "").toLowerCase();
        return (
          name.includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.username?.toLowerCase().includes(q) ?? false) ||
          sub.includes(q) ||
          parent.includes(q)
        );
      });
    }

    if (statusFilter) {
      list = list.filter((r) => (r.subscription_status || "none") === statusFilter);
    }

    if (adminFilter === "admin") {
      list = list.filter((r) => r.is_admin);
    } else if (adminFilter === "learner") {
      list = list.filter((r) => !r.is_admin);
    }

    const dir = sortDir;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "display":
          return compareStrings(learnerName(a.username, a.id), learnerName(b.username, b.id), dir);
        case "id":
          return compareStrings(a.id, b.id, dir);
        case "subscription_status":
          return compareStrings(
            formatSubscriptionStatus(a.subscription_status),
            formatSubscriptionStatus(b.subscription_status),
            dir,
          );
        case "is_admin":
          return compareBooleans(a.is_admin, b.is_admin, dir);
        case "created_at":
          return compareDates(a.created_at, b.created_at, dir);
        case "last_sign_in_at":
          return compareDatesNullable(a.last_sign_in_at, b.last_sign_in_at, dir);
        default:
          return 0;
      }
    });

    return list;
  }, [rows, search, statusFilter, adminFilter, sortKey, sortDir]);

  const totalFiltered = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, adminFilter]);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(page * pageSize, totalFiltered);

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-slate-900">Learners</h1>
        <p className="text-sm text-slate-600">No learner profiles yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <h1 className="font-display shrink-0 text-3xl font-bold text-slate-900">Learners</h1>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
          <div className="w-full max-w-sm sm:w-auto sm:min-w-[12rem]">
            <input
              id="learners-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, username, or id…"
              aria-label="Search learners"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/30 sm:min-w-[12rem]"
            />
          </div>
          <PanelSelectGroup>
            <PanelSelect
              label="Subscription"
              hideLabel
              value={statusFilter}
              onChange={setStatusFilter}
              options={SUBSCRIPTION_FILTERS}
            />
            <PanelSelect
              label="Role"
              hideLabel
              value={adminFilter}
              onChange={(v) =>
                setAdminFilter(v as (typeof ADMIN_FILTERS)[number]["value"])
              }
              options={ADMIN_FILTERS}
            />
            <PanelSelect
              label="Sort by"
              hideLabel
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              options={SORT_OPTIONS}
            />
            <PanelSelect
              label="Order"
              hideLabel
              value={sortDir}
              onChange={(v) => setSortDir(v as SortDir)}
              options={[
                { value: "asc", label: "Ascending" },
                { value: "desc", label: "Descending" },
              ]}
              triggerMinWidth="min-w-[9rem]"
            />
          </PanelSelectGroup>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[44rem] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th
                  scope="col"
                  className="w-14 px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Avatar
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Learner
                </th>
                <th
                  scope="col"
                  className="min-w-[10rem] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Parent email
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  User id
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Subscription
                </th>
                <th
                  scope="col"
                  className="w-24 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Admin
                </th>
                <th
                  scope="col"
                  className="w-48 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Joined
                </th>
                <th
                  scope="col"
                  className="w-48 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Last signed in
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-600">
                    No rows match your filters.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const avatar = getAvatarBySlug(row.avatar_slug);
                  const displayName = learnerName(row.username, row.id);
                  return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="w-14 px-3 py-2 align-middle">
                      <div className="relative mx-auto h-10 w-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        {avatar ? (
                          <Image
                            src={avatar.src}
                            alt={`${displayName} avatar`}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-slate-400"
                            aria-hidden
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{displayName}</td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-slate-700" title={row.parent_email ?? undefined}>
                      {row.parent_email ? (
                        <a
                          href={`mailto:${row.parent_email}`}
                          className="font-medium text-[#5a8f1d] underline-offset-2 hover:underline"
                        >
                          {row.parent_email}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.id}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatSubscriptionStatus(row.subscription_status)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.is_admin ? "Yes" : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.last_sign_in_at ? formatDateTime(row.last_sign_in_at) : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredSorted.length > 0 ? (
          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">{rangeStart}</span> to{" "}
              <span className="font-semibold text-slate-900">{rangeEnd}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalFiltered}</span> results
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <PanelSelect
                  label="Rows per page"
                  hideLabel
                  value={String(pageSize)}
                  onChange={(v) => {
                    const n = Number(v);
                    if (n === 25 || n === 50 || n === 75 || n === 100) {
                      setPageSize(n);
                      setCurrentPage(1);
                    }
                  }}
                  options={[...PAGE_SIZE_OPTIONS]}
                  triggerMinWidth="min-w-[4.5rem]"
                />
                <span className="text-xs font-semibold text-slate-500">per page</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
