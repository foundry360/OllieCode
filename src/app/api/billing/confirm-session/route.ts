import { NextResponse, type NextRequest } from "next/server";
import { updateProfileFromStripeSubscription } from "@/lib/billing/profileSubscription";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

/**
 * After Checkout redirect, the signed-in user confirms `session_id` belongs to them
 * and we sync subscription to `profiles` (helps before webhooks are configured).
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { session_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const sessionId = String(body.session_id ?? "").trim();
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.client_reference_id !== user.id) {
      return NextResponse.json({ error: "This checkout does not match your account." }, { status: 403 });
    }

    if (session.mode !== "subscription") {
      return NextResponse.json({ error: "Not a subscription checkout." }, { status: 400 });
    }

    if (session.status !== "complete") {
      return NextResponse.json({ error: "Checkout is not complete yet." }, { status: 409 });
    }

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

    const subRaw = session.subscription;
    const subscriptionId =
      typeof subRaw === "string" ? subRaw : subRaw && typeof subRaw === "object" && "id" in subRaw
        ? String((subRaw as { id: string }).id)
        : null;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscription on session." }, { status: 502 });
    }

    const sub =
      subRaw && typeof subRaw === "object" && "status" in subRaw
        ? (subRaw as { status: string })
        : await stripe.subscriptions.retrieve(subscriptionId);

    const stripeStatus = sub.status;
    const result = await updateProfileFromStripeSubscription(admin, user.id, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: stripeStatus,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Could not save subscription." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, subscription_status: stripeStatus }, { status: 200 });
  } catch (err) {
    console.error("[confirm-session]", err);
    return NextResponse.json({ error: "Could not verify checkout session." }, { status: 502 });
  }
}
