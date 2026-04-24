import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isOllieAvatarSlug } from "@/lib/profiles/avatarAssets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { avatarSlug?: unknown } = {};
  try {
    body = (await request.json()) as { avatarSlug?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const avatarSlug = typeof body.avatarSlug === "string" ? body.avatarSlug.trim() : "";
  if (!isOllieAvatarSlug(avatarSlug)) {
    return NextResponse.json({ error: "Invalid avatar." }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_slug: avatarSlug })
    .eq("id", user.id);

  if (error) {
    console.error("[profile/avatar]", error.message);
    return NextResponse.json({ error: "Could not update avatar." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, avatarSlug }, { status: 200 });
}
