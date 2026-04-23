import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Ensures `public.profiles` has a row for the signed-in user (same as `handle_new_user` trigger).
 * Repairs accounts that exist in `auth.users` but missed the trigger (e.g. created before it existed).
 */
export async function POST() {
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

  const { error } = await admin.from("profiles").upsert(
    { id: user.id },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[profile/ensure]", error.message);
    return NextResponse.json({ error: "Could not ensure profile row." }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
