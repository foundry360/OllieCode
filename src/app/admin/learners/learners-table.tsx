"use client";

import { useMemo, useState } from "react";
import { PanelSelect, PanelSelectGroup } from "@/components/ui/panel-select";

export type LearnerTableRow = {
  id: string;
  username: string | null;
  created_at: string;
  subscription_status: string;
  is_admin: boolean;
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

type SortKey = "display" | "id" | "subscription_status" | "is_admin" | "created_at";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "display", label: "Learner" },
  { value: "id", label: "User id" },
  { value: "subscription_status", label: "Subscription" },
  { value: "is_admin", label: "Admin" },
  { value: "created_at", label: "Joined" },
];

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

export function LearnersTable({ rows }: Readonly<{ rows: LearnerTableRow[] }>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [adminFilter, setAdminFilter] = useState<(typeof ADMIN_FILTERS)[number]["value"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.map((r) => ({
      ...r,
      is_admin: Boolean(r.is_admin),
    }));

    if (q) {
      list = list.filter((r) => {
        const name = learnerName(r.username, r.id).toLowerCase();
        const sub = formatSubscriptionStatus(r.subscription_status).toLowerCase();
        return (
          name.includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.username?.toLowerCase().includes(q) ?? false) ||
          sub.includes(q)
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
        default:
          return 0;
      }
    });

    return list;
  }, [rows, search, statusFilter, adminFilter, sortKey, sortDir]);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">No learner profiles yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-sm text-slate-600 lg:py-1">
          Showing{" "}
          <span className="font-semibold text-slate-900">{filteredSorted.length}</span>
          {filteredSorted.length !== rows.length ? (
            <>
              {" "}
              of <span className="font-semibold text-slate-900">{rows.length}</span> profiles
            </>
          ) : (
            <> profiles</>
          )}
        </p>

        <div className="flex w-full flex-col items-end gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <div className="flex w-full max-w-sm flex-col gap-1 sm:w-auto sm:min-w-[12rem]">
            <label htmlFor="learners-search" className="text-xs font-semibold text-slate-500">
              Search
            </label>
            <input
              id="learners-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, username, or id…"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/30 sm:min-w-[12rem]"
            />
          </div>
          <PanelSelectGroup>
            <PanelSelect
              label="Subscription"
              value={statusFilter}
              onChange={setStatusFilter}
              options={SUBSCRIPTION_FILTERS}
            />
            <PanelSelect
              label="Role"
              value={adminFilter}
              onChange={(v) =>
                setAdminFilter(v as (typeof ADMIN_FILTERS)[number]["value"])
              }
              options={ADMIN_FILTERS}
            />
            <PanelSelect
              label="Sort by"
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              options={SORT_OPTIONS}
            />
            <PanelSelect
              label="Order"
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
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Learner
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
              </tr>
            </thead>
            <tbody>
              {filteredSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-600">
                    No rows match your filters.
                  </td>
                </tr>
              ) : (
                filteredSorted.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {learnerName(row.username, row.id)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.id}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatSubscriptionStatus(row.subscription_status)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.is_admin ? "Yes" : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
