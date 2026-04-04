import { NextResponse, type NextRequest } from "next/server";
import { validateBirthDateForSignup } from "@/lib/auth/birthDate";
import { encryptPendingPassword } from "@/lib/auth/pendingPasswordCrypto";
import { sendParentApprovalEmail } from "@/lib/email/sendParentApprovalEmail";
import {
  normalizeUsername,
  validateUsernameNormalized,
} from "@/lib/profiles/username";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PARENT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Server is missing Supabase service role configuration." },
      { status: 503 },
    );
  }

  let body: {
    username?: string;
    password?: string;
    confirmPassword?: string;
    birthDate?: string;
    parentEmail?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const username = normalizeUsername(String(body.username ?? ""));
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");
  const birthDateRaw = String(body.birthDate ?? "").trim();
  const parentEmail = String(body.parentEmail ?? "").trim().toLowerCase();

  const uErr = validateUsernameNormalized(username);
  if (uErr) {
    return NextResponse.json({ error: uErr }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const birthErr = validateBirthDateForSignup(birthDateRaw);
  if (birthErr || !birthDateRaw) {
    return NextResponse.json(
      { error: birthErr ?? "Enter a valid birth date." },
      { status: 400 },
    );
  }

  if (!PARENT_EMAIL_RE.test(parentEmail)) {
    return NextResponse.json(
      { error: "Enter a valid parent or guardian email." },
      { status: 400 },
    );
  }

  try {
    encryptPendingPassword("test");
  } catch {
    return NextResponse.json(
      { error: "Server is missing PENDING_SIGNUP_SECRET." },
      { status: 503 },
    );
  }

  const { data: takenProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (takenProfile) {
    return NextResponse.json(
      { error: "That codename is already taken." },
      { status: 409 },
    );
  }

  const { data: pendingRow } = await admin
    .from("pending_signups")
    .select("id, expires_at")
    .eq("username", username)
    .maybeSingle();

  if (pendingRow && new Date(pendingRow.expires_at) > new Date()) {
    return NextResponse.json(
      {
        error:
          "A signup for this codename is already waiting for a parent to approve. Check the parent email or wait for it to expire.",
      },
      { status: 409 },
    );
  }

  if (pendingRow) {
    await admin.from("pending_signups").delete().eq("id", pendingRow.id);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const ciphertext = encryptPendingPassword(password);

  const { data: inserted, error: insertError } = await admin
    .from("pending_signups")
    .insert({
      username,
      password_ciphertext: ciphertext,
      age_gate_acknowledged: true,
      birth_date: birthDateRaw,
      parent_email: parentEmail,
      expires_at: expiresAt.toISOString(),
    })
    .select("approval_token")
    .single();

  if (insertError || !inserted) {
    console.error("pending_signups insert:", insertError?.message);
    return NextResponse.json(
      { error: "Could not save your signup. Try again in a moment." },
      { status: 500 },
    );
  }

  const token = inserted.approval_token as string;
  const origin = request.nextUrl.origin;
  const approvalUrl = `${origin}/api/auth/parent-approve?token=${token}`;

  /** Email not fully configured — keep pending row and return URL for manual sharing. */
  const emailConfigured =
    Boolean(process.env.EMAIL_API_URL?.trim()) &&
    Boolean(process.env.EMAIL_API_KEY?.trim()) &&
    Boolean(process.env.EMAIL_FROM?.trim());
  if (!emailConfigured) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      approvalUrl,
    });
  }

  const emailResult = await sendParentApprovalEmail({
    parentEmail,
    childUsername: username,
    approvalUrl,
  });

  if (!emailResult.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Parent email not sent (dev):", emailResult.message);
      return NextResponse.json({
        ok: true,
        emailSent: false,
        approvalUrl,
      });
    }
    await admin.from("pending_signups").delete().eq("approval_token", token);
    console.error("Parent email failed:", emailResult.message);
    return NextResponse.json(
      {
        error: "Could not send the parent email. Try again later or contact support.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailSent: true,
  });
}
