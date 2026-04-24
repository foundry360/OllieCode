import { NextResponse, type NextRequest } from "next/server";
import { getBillingSubjectAppUser, resolveStripeCustomerIdForUser } from "@/lib/billing/accountBilling";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { safeNextPath } from "@/lib/auth/safeNextPath";
import { absoluteUrl } from "@/lib/stripe/absoluteUrl";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { returnPath?: unknown } = {};
  try {
    body = (await request.json()) as { returnPath?: unknown };
  } catch {
    /* optional body */
  }

  const billingSubject = await getBillingSubjectAppUser(supabase, user);
  const admin = getSupabaseAdmin();
  const customerId = await resolveStripeCustomerIdForUser(
    stripe,
    supabase,
    billingSubject,
    admin ?? undefined,
  );
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing profile was found for this account yet." },
      { status: 404 },
    );
  }

  const rawReturnPath =
    typeof body.returnPath === "string" ? body.returnPath : "/workspace?settings=plan-billing";
  const returnPath = safeNextPath(rawReturnPath);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: absoluteUrl(request, returnPath),
    });
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[billing/portal]", error);
    return NextResponse.json(
      { error: "Could not open billing management right now." },
      { status: 502 },
    );
  }
}
