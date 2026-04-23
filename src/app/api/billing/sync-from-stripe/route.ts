import { NextResponse } from "next/server";
import { syncProfileSubscriptionFromStripe } from "@/lib/billing/syncSubscriptionFromStripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

/**
 * Reconciles `profiles.subscription_*` with Stripe for the signed-in user.
 * Used when webhooks or confirm-session did not persist state.
 */
export async function POST() {
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

  const result = await syncProfileSubscriptionFromStripe(stripe, admin, {
    id: user.id,
    email: user.email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, updated: result.updated }, { status: 200 });
}
