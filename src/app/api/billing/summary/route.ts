import { NextResponse } from "next/server";
import { loadAccountBillingSummary } from "@/lib/billing/accountBilling";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
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

  try {
    const summary = await loadAccountBillingSummary(stripe, supabase, {
      id: user.id,
      email: user.email,
    });
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("[billing/summary]", error);
    return NextResponse.json(
      { error: "Could not load your billing details right now." },
      { status: 502 },
    );
  }
}
