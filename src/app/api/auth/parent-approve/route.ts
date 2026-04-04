import { NextRequest, NextResponse } from "next/server";
import { usernameToAuthEmail } from "@/lib/auth/authEmailDomain";
import { decryptPendingPassword } from "@/lib/auth/pendingPasswordCrypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Parent clicks approval link in email — creates the child Auth user and profile.
 */
export async function GET(request: NextRequest) {
  const admin = getSupabaseAdmin();
  const origin = request.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(
      `${origin}/auth/parent-thanks?error=${encodeURIComponent(reason)}`,
    );

  if (!admin) {
    return fail("server_config");
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return fail("missing_token");
  }

  const { data: pending, error: fetchError } = await admin
    .from("pending_signups")
    .select("*")
    .eq("approval_token", token)
    .maybeSingle();

  if (fetchError || !pending) {
    return fail("invalid_or_expired");
  }

  if (new Date(pending.expires_at as string) < new Date()) {
    await admin.from("pending_signups").delete().eq("id", pending.id);
    return fail("invalid_or_expired");
  }

  const username = pending.username as string;
  let password: string;
  try {
    password = decryptPendingPassword(pending.password_ciphertext as string);
  } catch (e) {
    console.error("decrypt pending password:", e);
    return fail("server_config");
  }

  const email = usernameToAuthEmail(username);

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
    console.error("createUser:", createError?.message);
    const msg = createError?.message?.includes("already been registered")
      ? "taken"
      : "create_failed";
    return fail(msg);
  }

  const userId = created.user.id;

  const birthDate = pending.birth_date as string | null | undefined;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      username,
      ...(birthDate ? { birth_date: birthDate } : {}),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("profiles upsert:", profileError.message);
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      /* best effort */
    }
    return fail("create_failed");
  }

  await admin.from("pending_signups").delete().eq("id", pending.id);

  return NextResponse.redirect(`${origin}/auth/parent-thanks`);
}
