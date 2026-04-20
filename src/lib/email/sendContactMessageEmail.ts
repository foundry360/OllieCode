type SendContactArgs = {
  visitorName: string;
  visitorEmail: string;
  message: string;
};

/**
 * Delivers a visitor message to the team inbox (Resend: same env as parent approval).
 * Set CONTACT_INBOX_EMAIL to the address that should receive these messages.
 */
export async function sendContactMessageEmail({
  visitorName,
  visitorEmail,
  message,
}: SendContactArgs): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiUrl = process.env.EMAIL_API_URL?.trim();
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = process.env.CONTACT_INBOX_EMAIL?.trim();

  if (!apiUrl) {
    return { ok: false, message: "EMAIL_API_URL is not configured." };
  }
  if (!apiKey) {
    return { ok: false, message: "EMAIL_API_KEY is not configured." };
  }
  if (!from) {
    return { ok: false, message: "EMAIL_FROM is not configured." };
  }
  if (!to) {
    return { ok: false, message: "CONTACT_INBOX_EMAIL is not configured." };
  }

  const subject = `[Ollie Code] Message from ${visitorName || "visitor"}`;
  const html = contactMessageHtml(visitorName, visitorEmail, message);

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: visitorEmail,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, message: body || `Email API error ${res.status}` };
  }

  return { ok: true };
}

function contactMessageHtml(name: string, email: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111827;">
  <p><strong>New message</strong> from the Ollie Code website.</p>
  <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
  <strong>Email:</strong> ${escapeHtml(email)}</p>
  <pre style="white-space: pre-wrap; font-family: inherit; background: #f3f4f6; padding: 16px; border-radius: 12px;">${escapeHtml(message)}</pre>
  <p style="font-size: 12px; color: #6b7280;">Reply directly to this thread — the visitor’s address is set as Reply-To.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
