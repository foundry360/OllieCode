import type { SupabaseClient } from "@supabase/supabase-js";

/** Subscription states that may use paid workspace features. */
export function subscriptionAllowsWorkspace(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function updateProfileFromStripeSubscription(
  admin: SupabaseClient,
  userId: string,
  input: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscriptionStatus: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await admin
    .from("profiles")
    .update({
      stripe_customer_id: input.stripeCustomerId,
      stripe_subscription_id: input.stripeSubscriptionId,
      subscription_status: input.subscriptionStatus,
    })
    .eq("id", userId)
    .select("id");

  if (error) {
    console.error("[billing] profile update:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    console.error("[billing] profile update: no matching profile row for user", userId);
    return { ok: false, error: "Profile not found." };
  }
  return { ok: true };
}
