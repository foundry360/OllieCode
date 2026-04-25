import type { SupabaseClient } from "@supabase/supabase-js";

/** UTC calendar day key `YYYY-MM-DD` for bucketing signups. */
export function utcCalendarDayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function utcTodayMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export type ProfileCreatedRow = { created_at: string };

export function countsByUtcDay(rows: readonly ProfileCreatedRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const k = utcCalendarDayKey(d);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Oldest → newest: each key is a UTC calendar day. */
export function lastNDayKeysUtc(n: number, endDaysBeforeToday: number): string[] {
  const base = utcTodayMidnight();
  base.setUTCDate(base.getUTCDate() - endDaysBeforeToday);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(utcCalendarDayKey(d));
  }
  return keys;
}

export function sumCountsForKeys(map: Map<string, number>, keys: readonly string[]): number {
  let s = 0;
  for (const k of keys) s += map.get(k) ?? 0;
  return s;
}

/** Daily new profiles for sparkline (30 points, oldest left). */
export function dailySeriesForKeys(map: Map<string, number>, keys: readonly string[]): number[] {
  return keys.map((k) => map.get(k) ?? 0);
}

export type GrowthChangeTone = "up" | "down" | "flat";

export type GrowthPercentResult = {
  /** e.g. "+12.5%", "−4% decline", "0%" */
  label: string;
  tone: GrowthChangeTone;
};

/**
 * Loads `created_at` for profiles in range (paginated; PostgREST defaults to 1000 rows per request).
 */
export async function fetchProfileCreatedAtSince(
  admin: SupabaseClient,
  sinceIso: string,
): Promise<ProfileCreatedRow[]> {
  const pageSize = 1000;
  let offset = 0;
  const out: ProfileCreatedRow[] = [];
  for (;;) {
    const { data, error } = await admin
      .from("profiles")
      .select("created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error("[admin/learnerGrowth] fetchProfileCreatedAtSince:", error.message);
      break;
    }
    const chunk = (data ?? []) as ProfileCreatedRow[];
    out.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
    if (offset > 500_000) break;
  }
  return out;
}

export function formatGrowthVsPriorPeriod(recentTotal: number, priorTotal: number): GrowthPercentResult {
  if (priorTotal === 0 && recentTotal === 0) {
    return { label: "0%", tone: "flat" };
  }
  if (priorTotal === 0 && recentTotal > 0) {
    return { label: "+100%", tone: "up" };
  }
  const pct = ((recentTotal - priorTotal) / priorTotal) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) {
    return { label: "0%", tone: "flat" };
  }
  if (pct > 0) {
    return { label: `+${rounded}%`, tone: "up" };
  }
  return { label: `−${Math.abs(rounded)}% decline`, tone: "down" };
}
