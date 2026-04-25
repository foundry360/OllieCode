import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { formatGrowthVsPriorPeriod, lastNDayKeysUtc, type GrowthPercentResult } from "@/lib/admin/learnerGrowth";

export type StripeMrrSnapshot = {
  /** Contract MRR: recurring subscription amounts normalized to monthly (active subs only). */
  mrrCents: number;
  currency: string;
  skippedNonPrimaryCurrency: boolean;
  skippedNonRecurringItems: number;
  skippedMeteredItems: number;
};

export type StripeMrrDashboard = StripeMrrSnapshot & {
  /** Daily MRR cents (UTC), oldest → newest; null when snapshots are unavailable. */
  dailyMrrCents: readonly number[] | null;
  /** Level change vs start of 30-day window (same math as learner growth %). */
  mrrTrend: GrowthPercentResult | null;
};

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseUnitAmountCents(price: Stripe.Price): number {
  if (typeof price.unit_amount === "number") return price.unit_amount;
  if (price.unit_amount_decimal) return Math.round(Number(price.unit_amount_decimal));
  return 0;
}

function recurringToMonthlyMultiplier(interval: Stripe.Price.Recurring.Interval, intervalCount: number): number {
  const n = Math.max(1, intervalCount || 1);
  switch (interval) {
    case "day":
      return 30 / n;
    case "week":
      return 4.345 / n;
    case "month":
      return 1 / n;
    case "year":
      return 1 / (12 * n);
    default:
      return 0;
  }
}

function monthlyRecurringCentsForItem(price: Stripe.Price, quantity: number): number {
  const recurring = price.recurring;
  if (!recurring) return 0;
  if (recurring.usage_type === "metered") return 0;
  const unit = parseUnitAmountCents(price);
  if (unit <= 0) return 0;
  const mult = recurringToMonthlyMultiplier(recurring.interval, recurring.interval_count ?? 1);
  if (mult <= 0) return 0;
  return Math.round(unit * Math.max(1, quantity) * mult);
}

async function resolvePrice(
  stripe: Stripe,
  ref: Stripe.SubscriptionItem["price"],
  cache: Map<string, Stripe.Price>,
): Promise<Stripe.Price | null> {
  if (!ref) return null;
  if (typeof ref === "string") {
    const id = ref;
    const hit = cache.get(id);
    if (hit) return hit;
    const p = await stripe.prices.retrieve(id);
    cache.set(id, p);
    return p;
  }
  if (ref.id) cache.set(ref.id, ref);
  return ref;
}

/**
 * Contract MRR from **active** Stripe subscriptions only (excludes trialing).
 * Sums subscription item recurring prices, normalized to monthly (annual → ÷12, etc.).
 */
export async function computeStripeContractMrr(stripe: Stripe): Promise<StripeMrrSnapshot> {
  const priceCache = new Map<string, Stripe.Price>();

  let mrrCents = 0;
  let primaryCurrency: string | null = null;
  let skippedNonPrimaryCurrency = false;
  let skippedNonRecurringItems = 0;
  let skippedMeteredItems = 0;

  let startingAfter: string | undefined;
  for (;;) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.items.data.price"],
    });

    for (const sub of page.data) {
      for (const item of sub.items.data) {
        const price = await resolvePrice(stripe, item.price, priceCache);
        if (!price) {
          skippedNonRecurringItems += 1;
          continue;
        }
        if (price.recurring?.usage_type === "metered") {
          skippedMeteredItems += 1;
          continue;
        }
        const monthly = monthlyRecurringCentsForItem(price, item.quantity ?? 1);
        if (monthly <= 0) {
          if (!price.recurring) skippedNonRecurringItems += 1;
          continue;
        }
        const c = (price.currency ?? "usd").toLowerCase();
        if (!primaryCurrency) primaryCurrency = c;
        if (c !== primaryCurrency) {
          skippedNonPrimaryCurrency = true;
          continue;
        }
        mrrCents += monthly;
      }
    }

    if (!page.has_more) break;
    const last = page.data[page.data.length - 1];
    if (!last) break;
    startingAfter = last.id;
  }

  return {
    mrrCents,
    currency: primaryCurrency ?? "usd",
    skippedNonPrimaryCurrency,
    skippedNonRecurringItems,
    skippedMeteredItems,
  };
}

async function upsertTodayMrrSnapshot(
  admin: SupabaseClient,
  dayUtc: string,
  mrrCents: number,
  currency: string,
): Promise<void> {
  const { error } = await admin.from("admin_stripe_mrr_daily").upsert(
    { day_utc: dayUtc, mrr_cents: mrrCents, currency },
    { onConflict: "day_utc" },
  );
  if (error) {
    console.error("[admin/mrr] snapshot upsert:", error.message);
  }
}

function addUtcDays(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return utcDateString(dt);
}

async function fetchMrrSnapshotsInRange(
  admin: SupabaseClient,
  dayFrom: string,
  dayTo: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const { data, error } = await admin
    .from("admin_stripe_mrr_daily")
    .select("day_utc,mrr_cents")
    .gte("day_utc", dayFrom)
    .lte("day_utc", dayTo)
    .order("day_utc", { ascending: true });

  if (error) {
    console.error("[admin/mrr] range read:", error.message);
    return map;
  }
  for (const row of data ?? []) {
    if (typeof row.mrr_cents === "number") map.set(String(row.day_utc), row.mrr_cents);
  }
  return map;
}

function forwardFilledMrrSeries(
  keys: readonly string[],
  byDay: Map<string, number>,
  seedCents: number | null,
): number[] {
  let carry: number | null = seedCents;
  const out: number[] = [];
  for (const k of keys) {
    if (byDay.has(k)) carry = byDay.get(k)!;
    out.push(carry ?? 0);
  }
  return out;
}

async function fetchMrrOnOrBefore(
  admin: SupabaseClient,
  dayInclusive: string,
): Promise<{ day_utc: string; mrr_cents: number } | null> {
  const { data, error } = await admin
    .from("admin_stripe_mrr_daily")
    .select("day_utc,mrr_cents")
    .lte("day_utc", dayInclusive)
    .order("day_utc", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[admin/mrr] snapshot read:", error.message);
    return null;
  }
  if (!data || typeof data.mrr_cents !== "number") return null;
  return { day_utc: String(data.day_utc), mrr_cents: data.mrr_cents };
}

/**
 * Contract MRR from active subscriptions plus 30-day spark data from `admin_stripe_mrr_daily`.
 */
export async function computeStripeMrrDashboard(
  stripe: Stripe,
  admin: SupabaseClient | null,
): Promise<StripeMrrDashboard> {
  const live = await computeStripeContractMrr(stripe);
  const todayUtc = utcDateString(new Date());

  let dailyMrrCents: readonly number[] | null = null;
  let mrrTrend: GrowthPercentResult | null = null;

  if (admin) {
    await upsertTodayMrrSnapshot(admin, todayUtc, live.mrrCents, live.currency);

    const keys30 = lastNDayKeysUtc(30, 0);
    if (keys30.length > 0) {
      const first = keys30[0]!;
      const last = keys30[keys30.length - 1]!;
      const seed = await fetchMrrOnOrBefore(admin, addUtcDays(first, -1));
      const byDay = await fetchMrrSnapshotsInRange(admin, first, last);
      const series = forwardFilledMrrSeries(keys30, byDay, seed?.mrr_cents ?? null);
      dailyMrrCents = series;
      const start = series[0] ?? 0;
      const end = series[series.length - 1] ?? 0;
      mrrTrend = formatGrowthVsPriorPeriod(end, start);
    }
  }

  return {
    ...live,
    dailyMrrCents,
    mrrTrend,
  };
}

export type StripeRevenueTrailingYearSnapshot = {
  /** Net succeeded charges (amount minus refunds) in the trailing 365-day window, primary currency only. */
  revenueCents: number;
  currency: string;
  chargeCount: number;
  skippedNonPrimaryCurrency: boolean;
};

const THREE_SIXTY_FIVE_DAYS_SEC = 365 * 24 * 60 * 60;

/** Sum of succeeded Stripe charges minus refunds over the last 365 days (UTC `created`). */
export async function computeStripeTotalRevenueTrailingYear(
  stripe: Stripe,
): Promise<StripeRevenueTrailingYearSnapshot> {
  const now = Math.floor(Date.now() / 1000);
  const createdGte = now - THREE_SIXTY_FIVE_DAYS_SEC;

  let revenueCents = 0;
  let chargeCount = 0;
  let primaryCurrency: string | null = null;
  let skippedNonPrimaryCurrency = false;

  let chargeStartingAfter: string | undefined;
  for (;;) {
    const page = await stripe.charges.list({
      created: { gte: createdGte },
      limit: 100,
      starting_after: chargeStartingAfter,
    });

    for (const ch of page.data) {
      if (ch.status !== "succeeded") continue;
      const net = ch.amount - (ch.amount_refunded ?? 0);
      if (net <= 0) continue;
      const c = (ch.currency ?? "usd").toLowerCase();
      if (!primaryCurrency) primaryCurrency = c;
      if (c !== primaryCurrency) {
        skippedNonPrimaryCurrency = true;
        continue;
      }
      revenueCents += net;
      chargeCount += 1;
    }

    if (!page.has_more) break;
    const last = page.data[page.data.length - 1];
    if (!last) break;
    chargeStartingAfter = last.id;
  }

  return {
    revenueCents,
    currency: primaryCurrency ?? "usd",
    chargeCount,
    skippedNonPrimaryCurrency,
  };
}
