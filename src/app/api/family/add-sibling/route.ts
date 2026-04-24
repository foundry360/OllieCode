import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { parseSubscriptionPlanAndBilling } from "@/lib/billing/accountBilling";
import {
  attachSiblingToFamilyMaster,
  countFamilySeats,
  FAMILY_SEAT_CAP,
} from "@/lib/billing/familyGroupDb";
import { usernameToAuthEmail } from "@/lib/auth/authEmailDomain";
import { normalizeUsername, validateUsernameNormalized } from "@/lib/profiles/username";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

function pickActiveSubscription(subscriptions: Stripe.Subscription[]): Stripe.Subscription | null {
  if (!subscriptions.length) return null;
  const preferred = subscriptions
    .filter((s) => s.status === "active" || s.status === "trialing")
    .sort((a, b) => b.created - a.created)[0];
  if (preferred) return preferred;
  return [...subscriptions].sort((a, b) => b.created - a.created)[0] ?? null;
}

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin();
  const stripe = getStripe();
  const supabase = await createSupabaseServerClient();

  if (!admin || !stripe || !supabase) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { username?: unknown; password?: unknown; birth_date?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const rawUsername = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const birthDateRaw = body.birth_date;
  const birthDate =
    typeof birthDateRaw === "string" && birthDateRaw.trim() ? birthDateRaw.trim() : undefined;

  const username = normalizeUsername(rawUsername);
  const nameErr = validateUsernameNormalized(username);
  if (nameErr) {
    return NextResponse.json({ error: nameErr }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const masterId = user.id;

  const { data: selfSeat } = await admin
    .from("family_group_members")
    .select("master_user_id")
    .eq("master_user_id", masterId)
    .eq("member_user_id", masterId)
    .maybeSingle();

  if (!selfSeat) {
    return NextResponse.json(
      { error: "Only the Family plan master account can add sibling learners here." },
      { status: 403 },
    );
  }

  const { data: masterProfile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", masterId)
    .maybeSingle();

  const customerId = masterProfile?.stripe_customer_id?.trim();
  if (!customerId) {
    return NextResponse.json({ error: "Billing is not set up for this account yet." }, { status: 409 });
  }

  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 30 });
  const winning = pickActiveSubscription(subs.data);
  const { plan } = parseSubscriptionPlanAndBilling(winning);
  const subOk =
    winning &&
    (winning.status === "active" || winning.status === "trialing") &&
    plan === "family";

  if (!subOk) {
    return NextResponse.json(
      { error: "An active Family subscription is required to add siblings." },
      { status: 403 },
    );
  }

  const seats = await countFamilySeats(admin, masterId);
  if (seats >= FAMILY_SEAT_CAP) {
    return NextResponse.json(
      { error: `All ${FAMILY_SEAT_CAP} family seats are in use.` },
      { status: 400 },
    );
  }

  const email = usernameToAuthEmail(username);

  let newUserId: string | null = null;
  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        account_type: "child",
      },
    });

    if (createError || !created.user) {
      const msg = createError?.message ?? "Could not create account.";
      if (msg.includes("already been registered")) {
        return NextResponse.json({ error: "That codename is already taken." }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    newUserId = created.user.id;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: newUserId,
        username,
        ...(birthDate ? { birth_date: birthDate } : {}),
      },
      { onConflict: "id" },
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileError.message }, { status: 502 });
    }

    await attachSiblingToFamilyMaster(admin, masterId, newUserId);
  } catch (err) {
    if (newUserId) {
      try {
        await admin.auth.admin.deleteUser(newUserId);
      } catch {
        /* ignore */
      }
    }
    console.error("[family/add-sibling]", err);
    return NextResponse.json({ error: "Could not add sibling. Try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, userId: newUserId, username });
}
