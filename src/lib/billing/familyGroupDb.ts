import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { parseSubscriptionPlanAndBilling } from "@/lib/billing/accountBilling";

export const FAMILY_SEAT_CAP = 3;

/**
 * Keeps `family_group_members` in sync when Stripe subscription changes.
 * Family master row `(master, master)` is created when subscription is active/trialing on Family plan.
 */
export async function syncFamilyGroupFromStripeSubscription(
  admin: SupabaseClient,
  supabaseUserId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const { plan } = parseSubscriptionPlanAndBilling(subscription);
  const active = subscription.status === "active" || subscription.status === "trialing";
  if (active && plan === "family") {
    const { error } = await admin.from("family_group_members").upsert(
      { master_user_id: supabaseUserId, member_user_id: supabaseUserId },
      { onConflict: "master_user_id,member_user_id" },
    );
    if (error) {
      console.error("[family group] upsert master row:", error.message);
    }
  } else {
    await dissolveFamilyGroupForMaster(admin, supabaseUserId);
  }
}

/** Removes all roster rows for this master and clears `billing_master_user_id` on siblings. */
export async function dissolveFamilyGroupForMaster(
  admin: SupabaseClient,
  masterUserId: string,
): Promise<void> {
  const { data: children } = await admin
    .from("family_group_members")
    .select("member_user_id")
    .eq("master_user_id", masterUserId)
    .neq("member_user_id", masterUserId);

  const memberIds = (children ?? []).map((r) => r.member_user_id as string);
  if (memberIds.length) {
    const { error } = await admin
      .from("profiles")
      .update({ billing_master_user_id: null })
      .in("id", memberIds);
    if (error) {
      console.error("[family group] clear billing_master:", error.message);
    }
  }

  const { error: delErr } = await admin
    .from("family_group_members")
    .delete()
    .eq("master_user_id", masterUserId);
  if (delErr) {
    console.error("[family group] delete roster:", delErr.message);
  }
}

export async function countFamilySeats(admin: SupabaseClient, masterUserId: string): Promise<number> {
  const { count, error } = await admin
    .from("family_group_members")
    .select("member_user_id", { count: "exact", head: true })
    .eq("master_user_id", masterUserId);
  if (error) return 0;
  return count ?? 0;
}

export async function attachSiblingToFamilyMaster(
  admin: SupabaseClient,
  masterUserId: string,
  memberUserId: string,
): Promise<void> {
  const { error } = await admin.from("family_group_members").insert({
    master_user_id: masterUserId,
    member_user_id: memberUserId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const { error: pErr } = await admin
    .from("profiles")
    .update({ billing_master_user_id: masterUserId })
    .eq("id", memberUserId);
  if (pErr) {
    throw new Error(pErr.message);
  }
}
