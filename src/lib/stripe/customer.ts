import type Stripe from "stripe";
import { getAuthEmailDomain } from "@/lib/auth/authEmailDomain";

export function isKidSyntheticAuthEmail(authEmail: string | null | undefined): boolean {
  const e = authEmail?.trim().toLowerCase();
  if (!e || !e.includes("@")) return false;
  const domain = getAuthEmailDomain().trim().toLowerCase();
  return e.endsWith(`@${domain}`);
}

/** True when Stripe Customer was wrongly tied to a kid account (e.g. parent's wallet + our metadata). */
export function isMislinkedKidAuthToParentStripeWallet(
  authEmail: string | null | undefined,
  stripeCustomer: { email: string | null; metadata?: Stripe.Metadata | null },
): boolean {
  if (!isKidSyntheticAuthEmail(authEmail)) return false;
  const cust = stripeCustomer.email?.trim().toLowerCase() ?? "";
  if (!cust) return false;
  const auth = authEmail?.trim().toLowerCase() ?? "";
  return auth !== cust;
}

/**
 * Accounts V2 + test mode: Checkout requires an existing Customer (customer_email alone is rejected).
 * Prefer metadata lookup so the link survives email changes.
 */
export async function getOrCreateStripeCustomerId(
  stripe: Stripe,
  user: { id: string; email: string | null | undefined },
): Promise<string> {
  const userId = user.id;
  const email = user.email?.trim() || null;

  try {
    const found = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    const existing = found.data[0];
    if (existing) {
      // Buggy email fallback could assign a parent's Customer to this user_id. Metadata matches
      // but the Customer email is the parent's while Auth uses the kid synthetic address — keep
      // showing the parent's saved cards. Drop the bad link and mint a fresh Customer.
      if (isMislinkedKidAuthToParentStripeWallet(email, existing)) {
        try {
          const meta = { ...(existing.metadata ?? {}) } as Record<string, string>;
          delete meta.supabase_user_id;
          await stripe.customers.update(existing.id, { metadata: meta });
        } catch (err) {
          console.warn("[stripe customer] could not clear mis-linked metadata:", err);
        }
      } else {
        if (email && existing.email && existing.email !== email) {
          await stripe.customers.update(existing.id, { email });
        }
        return existing.id;
      }
    }
  } catch (err) {
    console.warn("[stripe customer] search by metadata failed:", err);
  }

  // Never use `customers.list({ email })` to pick a customer: the same email can exist on a
  // different person's Stripe Customer (e.g. parent). Reusing it would show their saved cards.

  const created = await stripe.customers.create({
    ...(email ? { email } : {}),
    metadata: { supabase_user_id: userId },
  });
  return created.id;
}
