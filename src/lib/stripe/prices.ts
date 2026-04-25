/**
 * Checkout uses **Stripe Price IDs** (`price_…`) only. Each paid plan should mirror Family:
 * **one Product** in Stripe with **two recurring prices** (monthly + yearly), then set the four
 * env vars below. Using two separate Products for Starter still works at checkout but breaks
 * catalog parity; run `npm run stripe:verify-catalog` to confirm month/year share a product.
 */
export type PaidPlanId = "starter" | "family";
export type BillingInterval = "month" | "year";

export type PlanCheckoutAvailability = Record<
  PaidPlanId,
  { month: boolean; year: boolean }
>;

export function getPlanCheckoutAvailability(): PlanCheckoutAvailability {
  return {
    starter: {
      month: Boolean(process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim()),
      year: Boolean(process.env.STRIPE_PRICE_STARTER_YEARLY?.trim()),
    },
    family: {
      month: Boolean(process.env.STRIPE_PRICE_FAMILY_MONTHLY?.trim()),
      year: Boolean(process.env.STRIPE_PRICE_FAMILY_YEARLY?.trim()),
    },
  };
}

export function getStripePriceId(
  plan: PaidPlanId,
  billing: BillingInterval,
): string | null {
  if (plan === "starter") {
    return billing === "month"
      ? process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim() || null
      : process.env.STRIPE_PRICE_STARTER_YEARLY?.trim() || null;
  }
  return billing === "month"
    ? process.env.STRIPE_PRICE_FAMILY_MONTHLY?.trim() || null
    : process.env.STRIPE_PRICE_FAMILY_YEARLY?.trim() || null;
}
