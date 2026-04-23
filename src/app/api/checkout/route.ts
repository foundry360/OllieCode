import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/stripe/absoluteUrl";
import { getStripe } from "@/lib/stripe/server";
import {
  getStripePriceId,
  type BillingInterval,
  type PaidPlanId,
} from "@/lib/stripe/prices";

function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === "starter" || value === "family";
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  let body: { plan?: unknown; billing?: unknown; embedded?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isPaidPlanId(body.plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  if (!isBillingInterval(body.billing)) {
    return NextResponse.json({ error: "Invalid billing interval." }, { status: 400 });
  }

  const priceId = getStripePriceId(body.plan, body.billing);
  if (!priceId) {
    return NextResponse.json(
      { error: "That billing option is not configured yet." },
      { status: 400 },
    );
  }

  const embedded = body.embedded === true;

  const successUrl = `${absoluteUrl(request, "/checkout/success")}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = absoluteUrl(request, "/workspace");
  const workspaceReturnUrl = `${absoluteUrl(request, "/workspace")}?stripe_checkout_return=1&session_id={CHECKOUT_SESSION_ID}`;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server auth is not configured." },
      { status: 503 },
    );
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to subscribe.", code: "sign_in_required" },
      { status: 401 },
    );
  }

  const customerEmail = user.email?.trim();

  const commonSessionFields = {
    mode: "subscription" as const,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    client_reference_id: user.id,
    metadata: {
      plan: body.plan,
      billing: body.billing,
    },
    subscription_data: {
      metadata: {
        plan: body.plan,
        billing: body.billing,
        supabase_user_id: user.id,
      },
    },
  };

  try {
    if (embedded) {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        ...commonSessionFields,
        ui_mode: "embedded_page",
        return_url: workspaceReturnUrl,
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      if (!session.client_secret) {
        return NextResponse.json(
          { error: "Checkout session did not return a client secret." },
          { status: 502 },
        );
      }

      return NextResponse.json({ clientSecret: session.client_secret }, { status: 200 });
    }

    const session = await stripe.checkout.sessions.create({
      ...commonSessionFields,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session did not return a URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
