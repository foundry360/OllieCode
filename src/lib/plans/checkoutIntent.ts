import type { BillingInterval, PaidPlanId } from "@/lib/stripe/prices";

const CHECKOUT_INTENT_BASES = ["/plans", "/plans/welcome", "/workspace"] as const;
export type PlansCheckoutIntentBasePath = (typeof CHECKOUT_INTENT_BASES)[number];

export function normalizePlansCheckoutBasePath(raw: string | undefined): PlansCheckoutIntentBasePath {
  const t = (raw ?? "/plans").trim();
  return CHECKOUT_INTENT_BASES.includes(t as PlansCheckoutIntentBasePath)
    ? (t as PlansCheckoutIntentBasePath)
    : "/plans";
}

export function buildPlansCheckoutIntentPath(
  planId: PaidPlanId,
  billing: BillingInterval,
  basePath: string = "/plans",
): string {
  const safe = normalizePlansCheckoutBasePath(basePath);
  const q = new URLSearchParams({ plan: planId, billing });
  return `${safe}?${q.toString()}`;
}

export function parsePlansCheckoutIntent(searchParams: URLSearchParams): {
  planId: PaidPlanId;
  billing: BillingInterval;
} | null {
  const plan = searchParams.get("plan")?.trim();
  const billing = searchParams.get("billing")?.trim();
  if (plan !== "starter" && plan !== "family") return null;
  if (billing !== "month" && billing !== "year") return null;
  return { planId: plan, billing };
}
