import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { syncFamilyGroupFromStripeSubscription } from "@/lib/billing/familyGroupDb";
import { updateProfileFromStripeSubscription } from "@/lib/billing/profileSubscription";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

async function syncSubscriptionFromStripeObject(admin: SupabaseClient, subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id ?? subscription.metadata?.user_id;
  if (!userId) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (!customerId) return;
    const { data: row } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (!row?.id) {
      console.warn("[stripe webhook] subscription without user mapping:", subscription.id);
      return;
    }
    const uid = row.id as string;
    await updateProfileFromStripeSubscription(admin, uid, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });
    await syncFamilyGroupFromStripeSubscription(admin, uid, subscription);
    return;
  }

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;

  await updateProfileFromStripeSubscription(admin, userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
  });
  await syncFamilyGroupFromStripeSubscription(admin, userId, subscription);
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.client_reference_id;
        if (!userId) {
          console.warn("[stripe webhook] checkout.session.completed without client_reference_id");
          break;
        }
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subId) break;
        const subscription = await stripe.subscriptions.retrieve(subId);
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        await updateProfileFromStripeSubscription(admin, userId, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        });
        await syncFamilyGroupFromStripeSubscription(admin, userId, subscription);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripeObject(admin, subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler:", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
