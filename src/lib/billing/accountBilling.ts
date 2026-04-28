import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { isMislinkedKidAuthToParentStripeWallet } from "@/lib/stripe/customer";
import { getStripePriceId, type BillingInterval, type PaidPlanId } from "@/lib/stripe/prices";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BillingAppUser = {
  id: string;
  email: string | null | undefined;
};

type AppUser = BillingAppUser;

export type BillingCardSummary = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type AccountBillingSummary = {
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  plan: PaidPlanId | null;
  billing: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  portalAvailable: boolean;
  paymentMethod: BillingCardSummary | null;
  /** Stripe/billing customer this summary was loaded for (master when on a Family seat). */
  billingSubjectUserId: string | null;
  /** True when this user is the Family master (owns Stripe subscription for the household). */
  isFamilyBillingMaster: boolean;
  /** Seats in use when `plan` is family (master + siblings); null otherwise. */
  familySeatsUsed: number | null;
  familySeatsCap: number | null;
  /**
   * Next renewal total from a Stripe invoice preview (includes coupons/discounts).
   * When set, prefer this over catalog list prices in account UI (e.g. "$0/month").
   */
  recurringPriceDisplay: string | null;
  /** Customer-facing promotion code on the subscription discount, when expanded from Stripe. */
  discountPromotionCode: string | null;
};

function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === "starter" || value === "family";
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

function inferPlanAndBillingFromPriceId(priceId: string | null | undefined): {
  plan: PaidPlanId | null;
  billing: BillingInterval | null;
} {
  const t = priceId?.trim() ?? "";
  if (!t) return { plan: null, billing: null };

  const knownPlans: PaidPlanId[] = ["starter", "family"];
  const knownBilling: BillingInterval[] = ["month", "year"];
  for (const plan of knownPlans) {
    for (const billing of knownBilling) {
      if (getStripePriceId(plan, billing) === t) {
        return { plan, billing };
      }
    }
  }

  return { plan: null, billing: null };
}

function pickBestSubscription(subscriptions: Stripe.Subscription[]): Stripe.Subscription | null {
  if (!subscriptions.length) return null;

  const preferred = subscriptions
    .filter((sub) => sub.status === "active" || sub.status === "trialing")
    .sort((a, b) => b.created - a.created)[0];

  if (preferred) return preferred;

  return [...subscriptions].sort((a, b) => b.created - a.created)[0] ?? null;
}

function getPaymentMethodId(
  value:
    | string
    | Stripe.PaymentMethod
    | { id: string; deleted?: boolean }
    | null
    | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if ("deleted" in value && value.deleted) return null;
  return value.id;
}

async function retrieveCardPaymentMethod(
  stripe: Stripe,
  paymentMethodId: string | null,
): Promise<BillingCardSummary | null> {
  if (!paymentMethodId) return null;

  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if ("deleted" in paymentMethod && paymentMethod.deleted) return null;
    if (paymentMethod.type !== "card" || !paymentMethod.card) return null;

    return {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expMonth: paymentMethod.card.exp_month,
      expYear: paymentMethod.card.exp_year,
    };
  } catch {
    return null;
  }
}

function priceIdFromSubscriptionItem(
  price: Stripe.SubscriptionItem["price"] | null | undefined,
): string | null {
  if (!price) return null;
  if (typeof price === "string") return price;
  return price.id ?? null;
}

export function parseSubscriptionPlanAndBilling(subscription: Stripe.Subscription | null): {
  plan: PaidPlanId | null;
  billing: BillingInterval | null;
} {
  if (!subscription) {
    return { plan: null, billing: null };
  }

  const metaPlan = subscription.metadata?.plan;
  const metaBilling = subscription.metadata?.billing;
  if (isPaidPlanId(metaPlan) && isBillingInterval(metaBilling)) {
    return { plan: metaPlan, billing: metaBilling };
  }

  const firstItem = subscription.items.data[0];
  return inferPlanAndBillingFromPriceId(priceIdFromSubscriptionItem(firstItem?.price));
}

function formatInvoiceTotalForPlanLine(
  totalMinorUnits: number,
  currency: string | null | undefined,
  billing: BillingInterval,
): string {
  const cur = (currency ?? "usd").toLowerCase();
  const suffix = billing === "month" ? "month" : "year";
  if (cur === "usd") {
    if (totalMinorUnits % 100 === 0) {
      return `$${totalMinorUnits / 100}/${suffix}`;
    }
    return `$${(totalMinorUnits / 100).toFixed(2)}/${suffix}`;
  }
  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur.toUpperCase(),
    }).format(totalMinorUnits / 100);
    return `${formatted}/${suffix}`;
  } catch {
    return `${(totalMinorUnits / 100).toFixed(2)} ${cur.toUpperCase()}/${suffix}`;
  }
}

async function loadRecurringPriceDisplayFromStripe(
  stripe: Stripe,
  customerId: string,
  subscriptionId: string,
  billing: BillingInterval,
): Promise<string | null> {
  try {
    const preview = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: subscriptionId,
    });
    const total = typeof preview.total === "number" ? preview.total : 0;
    return formatInvoiceTotalForPlanLine(total, preview.currency, billing);
  } catch {
    return null;
  }
}

function promotionCodeFromExpandedSubscription(sub: Stripe.Subscription): string | null {
  const discounts = (
    sub as Stripe.Subscription & {
      discounts?: Array<{ promotion_code?: string | Stripe.PromotionCode | null }> | null;
    }
  ).discounts;
  if (!Array.isArray(discounts)) return null;
  for (const d of discounts) {
    if (!d || typeof d !== "object") continue;
    const pc = d.promotion_code;
    if (pc && typeof pc === "object" && "code" in pc) {
      const code = (pc as { code?: string | null }).code?.trim();
      if (code) return code;
    }
  }
  return null;
}

function getSubscriptionPeriodEndIso(subscription: Stripe.Subscription | null): string | null {
  if (!subscription) return null;

  const topLevelPeriodEnd = (subscription as unknown as { current_period_end?: unknown })
    .current_period_end;
  if (typeof topLevelPeriodEnd === "number") {
    return new Date(topLevelPeriodEnd * 1000).toISOString();
  }

  const firstItem = subscription.items.data[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number | null })
    | undefined;
  if (typeof firstItem?.current_period_end === "number") {
    return new Date(firstItem.current_period_end * 1000).toISOString();
  }

  return null;
}

export async function resolveStripeCustomerIdForUser(
  stripe: Stripe,
  supabase: SupabaseClient,
  user: AppUser,
  profileClient?: SupabaseClient,
): Promise<string | null> {
  const client = profileClient ?? supabase;
  const { data: profile } = await client
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const fromProfile = profile?.stripe_customer_id?.trim();
  if (fromProfile) {
    try {
      const existing = await stripe.customers.retrieve(fromProfile);
      if (typeof existing === "string" || existing.deleted) {
        /* fall through */
      } else if (isMislinkedKidAuthToParentStripeWallet(user.email, existing)) {
        /* fall through */
      } else {
        const metaUid = existing.metadata?.supabase_user_id?.trim() || null;
        // Trust the profile link when metadata is missing (e.g. Dashboard-created customers) or
        // matches; reject only when metadata clearly points at a different Supabase user.
        if (!metaUid || metaUid === user.id) {
          return existing.id;
        }
      }
    } catch {
      /* ignore and fall through to metadata search */
    }
  }

  try {
    const found = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${user.id.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    const existing = found.data[0];
    if (
      existing &&
      !isMislinkedKidAuthToParentStripeWallet(user.email, existing)
    ) {
      return existing.id;
    }
  } catch {
    /* ignore */
  }

  return null;
}

const FAMILY_SEAT_CAP = 3;

/**
 * Stripe customer + subscriptions are stored on the Family master profile.
 * Siblings reference the master via `profiles.billing_master_user_id`.
 */
export async function getBillingSubjectAppUser(
  supabase: SupabaseClient,
  authUser: { id: string; email?: string | null },
): Promise<BillingAppUser> {
  const admin = getSupabaseAdmin();
  const profileClient = admin ?? supabase;
  const { data: myProfile } = await profileClient
    .from("profiles")
    .select("billing_master_user_id")
    .eq("id", authUser.id)
    .maybeSingle();

  const billingMasterId =
    typeof myProfile?.billing_master_user_id === "string"
      ? myProfile.billing_master_user_id.trim() || null
      : null;
  const subjectId = billingMasterId ?? authUser.id;

  let subjectEmail = authUser.email;
  if (subjectId !== authUser.id && admin) {
    try {
      const { data: authData } = await admin.auth.admin.getUserById(subjectId);
      subjectEmail = authData.user?.email ?? null;
    } catch {
      subjectEmail = null;
    }
  }

  return { id: subjectId, email: subjectEmail };
}

export async function loadAccountBillingSummary(
  stripe: Stripe,
  supabase: SupabaseClient,
  user: AppUser,
): Promise<AccountBillingSummary> {
  const admin = getSupabaseAdmin();
  const profileClient = admin ?? supabase;

  const empty: AccountBillingSummary = {
    customerId: null,
    subscriptionId: null,
    subscriptionStatus: null,
    plan: null,
    billing: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    portalAvailable: false,
    paymentMethod: null,
    billingSubjectUserId: null,
    isFamilyBillingMaster: false,
    familySeatsUsed: null,
    familySeatsCap: null,
    recurringPriceDisplay: null,
    discountPromotionCode: null,
  };

  const billingSubject = await getBillingSubjectAppUser(supabase, user);
  const billingSubjectId = billingSubject.id;

  const { data: myProfile } = await profileClient
    .from("profiles")
    .select("billing_master_user_id")
    .eq("id", user.id)
    .maybeSingle();
  const billingMasterId =
    typeof myProfile?.billing_master_user_id === "string"
      ? myProfile.billing_master_user_id.trim() || null
      : null;

  const customerId = await resolveStripeCustomerIdForUser(
    stripe,
    supabase,
    billingSubject,
    profileClient,
  );
  if (!customerId) {
    return { ...empty, billingSubjectUserId: billingSubjectId };
  }

  let customer:
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null = null;
  try {
    customer = await stripe.customers.retrieve(customerId);
  } catch {
    customer = null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 30,
  });

  const winning = pickBestSubscription(subscriptions.data);
  const { plan, billing } = parseSubscriptionPlanAndBilling(winning);

  const paymentMethodId =
    getPaymentMethodId(winning?.default_payment_method) ||
    (customer && typeof customer !== "string" && !customer.deleted
      ? getPaymentMethodId(customer.invoice_settings.default_payment_method)
      : null);

  let familySeatsUsed: number | null = null;
  let familySeatsCap: number | null = null;
  if (plan === "family" && admin) {
    const { count } = await admin
      .from("family_group_members")
      .select("member_user_id", { count: "exact", head: true })
      .eq("master_user_id", billingSubjectId);
    familySeatsUsed = count ?? 0;
    familySeatsCap = FAMILY_SEAT_CAP;
  }

  const isFamilyBillingMaster =
    plan === "family" && billingMasterId === null && billingSubjectId === user.id;

  let recurringPriceDisplay: string | null = null;
  let discountPromotionCode: string | null = null;

  if (
    winning &&
    billing &&
    (winning.status === "active" || winning.status === "trialing")
  ) {
    recurringPriceDisplay = await loadRecurringPriceDisplayFromStripe(
      stripe,
      customerId,
      winning.id,
      billing,
    );
    try {
      const subExpanded = await stripe.subscriptions.retrieve(winning.id, {
        expand: ["discounts.promotion_code"],
      });
      discountPromotionCode = promotionCodeFromExpandedSubscription(subExpanded);
    } catch {
      /* ignore */
    }
  }

  return {
    customerId,
    subscriptionId: winning?.id ?? null,
    subscriptionStatus: winning?.status ?? null,
    plan,
    billing,
    currentPeriodEnd: getSubscriptionPeriodEndIso(winning),
    cancelAtPeriodEnd: winning?.cancel_at_period_end === true,
    portalAvailable: true,
    paymentMethod: await retrieveCardPaymentMethod(stripe, paymentMethodId),
    billingSubjectUserId: billingSubjectId,
    isFamilyBillingMaster,
    familySeatsUsed,
    familySeatsCap,
    recurringPriceDisplay,
    discountPromotionCode,
  };
}
