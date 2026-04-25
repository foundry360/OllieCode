import type { SupabaseClient } from "@supabase/supabase-js";
import { dailySeriesForKeys, sumCountsForKeys, utcCalendarDayKey } from "@/lib/admin/learnerGrowth";

export type CanceledUpdateRow = { updated_at: string };

export function countsByUtcDayUpdatedAt(rows: readonly CanceledUpdateRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.updated_at);
    if (Number.isNaN(d.getTime())) continue;
    const k = utcCalendarDayKey(d);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/**
 * Canceled subscriptions (profiles) whose `updated_at` falls in range (paginated).
 * Bucketing uses `updated_at` as a proxy for when the row last reflected cancellation (not a true audit trail).
 */
export async function fetchCanceledProfileUpdatesSince(
  admin: SupabaseClient,
  sinceIso: string,
): Promise<CanceledUpdateRow[]> {
  const pageSize = 1000;
  let offset = 0;
  const out: CanceledUpdateRow[] = [];
  for (;;) {
    const { data, error } = await admin
      .from("profiles")
      .select("updated_at")
      .eq("subscription_status", "canceled")
      .gte("updated_at", sinceIso)
      .order("updated_at", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error("[admin/churnStats] fetchCanceledProfileUpdatesSince:", error.message);
      break;
    }
    const chunk = (data ?? []) as CanceledUpdateRow[];
    out.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
    if (offset > 500_000) break;
  }
  return out;
}

export type ChurnSentiment = "better" | "worse" | "flat";

export type ChurnChangeResult = {
  label: string;
  sentiment: ChurnSentiment;
};

/** Fewer canceled-profile updates vs prior window = better (green); more = worse (red). */
export function computeChurnFromRows(
  rows: readonly CanceledUpdateRow[],
  keysRecent30: readonly string[],
  keysPrior30: readonly string[],
): { dailySeries: number[]; recent: number; prior: number } {
  const byDay = countsByUtcDayUpdatedAt(rows);
  return {
    dailySeries: dailySeriesForKeys(byDay, keysRecent30),
    recent: sumCountsForKeys(byDay, keysRecent30),
    prior: sumCountsForKeys(byDay, keysPrior30),
  };
}

export function formatChurnVsPriorPeriod(recentTotal: number, priorTotal: number): ChurnChangeResult {
  if (priorTotal === 0 && recentTotal === 0) {
    return { label: "0% change", sentiment: "flat" };
  }
  if (priorTotal === 0 && recentTotal > 0) {
    return { label: "+100%", sentiment: "worse" };
  }
  const pct = ((recentTotal - priorTotal) / priorTotal) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) {
    return { label: "0% change", sentiment: "flat" };
  }
  if (pct > 0) {
    return { label: `+${rounded}%`, sentiment: "worse" };
  }
  return { label: `−${Math.abs(rounded)}%`, sentiment: "better" };
}
