import { NextResponse, type NextRequest } from "next/server";
import { sendContactMessageEmail } from "@/lib/email/sendContactMessageEmail";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 120;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    message?: string;
    website?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (String(body.website ?? "").trim()) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const name = String(body.name ?? "").trim().slice(0, MAX_NAME);
  const email = String(body.email ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < MIN_MESSAGE) {
    return NextResponse.json(
      { error: `Please write at least ${MIN_MESSAGE} characters.` },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  let authUserId: string | null = null;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authUserId = user?.id ?? null;
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    const { error: insertErr } = await admin.from("contact_inbox_messages").insert({
      visitor_name: name,
      visitor_email: email,
      message,
      auth_user_id: authUserId,
    });

    if (insertErr) {
      console.error("[api/contact] inbox insert:", insertErr.message);
      return NextResponse.json(
        { error: "We could not save your message right now. Please try again later." },
        { status: 502 },
      );
    }

    const emailConfigured =
      Boolean(process.env.EMAIL_API_URL?.trim()) &&
      Boolean(process.env.EMAIL_API_KEY?.trim()) &&
      Boolean(process.env.EMAIL_FROM?.trim()) &&
      Boolean(process.env.CONTACT_INBOX_EMAIL?.trim());

    if (emailConfigured) {
      const sent = await sendContactMessageEmail({ visitorName: name, visitorEmail: email, message });
      if (!sent.ok) {
        console.error("[api/contact] email forward failed:", sent.message);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const sent = await sendContactMessageEmail({ visitorName: name, visitorEmail: email, message });
  if (!sent.ok) {
    const configured =
      Boolean(process.env.EMAIL_API_URL?.trim()) &&
      Boolean(process.env.EMAIL_API_KEY?.trim()) &&
      Boolean(process.env.EMAIL_FROM?.trim()) &&
      Boolean(process.env.CONTACT_INBOX_EMAIL?.trim());

    if (!configured) {
      return NextResponse.json(
        {
          error: "not_configured",
          fallbackEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "We could not send your message right now. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
