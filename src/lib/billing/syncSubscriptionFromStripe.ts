import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { syncFamilyGroupFromStripeSubscription } from "@/lib/billing/familyGroupDb";
import { updateProfileFromStripeSubscription } from "@/lib/billing/profileSubscription";

async function findStripeCustomerId(
  stripe: Stripe,
  userId: string,
  email: string | null,
): Promise<string | null> {
  try {
    const found = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    if (found.data[0]) {
      return found.data[0].id;
    }
  } catch {
    /* ignore */
  }

  if (email) {
    const listed = await stripe.customers.list({ email, limit: 10 });
    for (const c of listed.data) {
      if (c.metadata?.supabase_user_id === userId) {
        return c.id;
      }
    }
  }

  return null;
}

/**
 * If Stripe has an active/trialing subscription for this user but `profiles` is stale,
 * update the row (missed webhook, failed confirm-session, etc.).
 */
export async function syncProfileSubscriptionFromStripe(
  stripe: Stripe,
  admin: SupabaseClient,
  user: { id: string; email: string | null | undefined },
): Promise<{ ok: true; updated: boolean } | { ok: false; error: string }> {
  const userId = user.id;
  const email = user.email?.trim() ?? null;

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  let customerId: string | null =
    profile && typeof profile.stripe_customer_id === "string"
      ? profile.stripe_customer_id.trim() || null
      : null;

  if (!customerId) {
    customerId = await findStripeCustomerId(stripe, userId, email);
  }

  if (!customerId) {
    return { ok: true, updated: false };
  }

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 30,
  });

  const winning = subs.data
    .filter((s) => s.status === "active" || s.status === "trialing")
    .sort((a, b) => b.created - a.created)[0];

  if (!winning) {
    return { ok: true, updated: false };
  }

  const result = await updateProfileFromStripeSubscription(admin, userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: winning.id,
    subscriptionStatus: winning.status,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Update failed." };
  }

  await syncFamilyGroupFromStripeSubscription(admin, userId, winning);

  return { ok: true, updated: true };
}
