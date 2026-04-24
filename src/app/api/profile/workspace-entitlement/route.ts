import { NextResponse } from "next/server";
import { subscriptionAllowsWorkspace } from "@/lib/billing/profileSubscription";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Returns whether the signed-in user may use paid workspace features,
 * including Family-plan siblings billing under a master profile.
 */
export async function GET() {
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

  const admin = getSupabaseAdmin();
  const db = admin ?? supabase;

  const { data: profile, error } = await db
    .from("profiles")
    .select("subscription_status, is_admin, billing_master_user_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      { entitled: false, subscription_status: null as string | null },
      { status: 200 },
    );
  }

  if (profile.is_admin === true) {
    return NextResponse.json({
      entitled: true,
      subscription_status: (profile.subscription_status as string) ?? "active",
    });
  }

  if (subscriptionAllowsWorkspace(profile.subscription_status)) {
    return NextResponse.json({
      entitled: true,
      subscription_status: profile.subscription_status as string,
    });
  }

  const masterId =
    typeof profile.billing_master_user_id === "string"
      ? profile.billing_master_user_id.trim()
      : null;

  if (masterId && admin) {
    const { data: masterProfile } = await admin
      .from("profiles")
      .select("subscription_status")
      .eq("id", masterId)
      .maybeSingle();

    if (
      masterProfile &&
      subscriptionAllowsWorkspace(masterProfile.subscription_status as string | null)
    ) {
      return NextResponse.json({
        entitled: true,
        subscription_status: masterProfile.subscription_status as string,
      });
    }
  }

  return NextResponse.json({
    entitled: false,
    subscription_status: (profile.subscription_status as string) ?? null,
  });
}
