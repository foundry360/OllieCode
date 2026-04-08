type SendArgs = {
  parentEmail: string;
  childUsername: string;
  approvalUrl: string;
};

/**
 * Sends the parent approval message from your API route (POST to EMAIL_API_URL).
 * Resend: EMAIL_API_URL=https://api.resend.com/emails, Bearer EMAIL_API_KEY, body { from, to, subject, html }.
 */
export async function sendParentApprovalEmail({
  parentEmail,
  childUsername,
  approvalUrl,
}: SendArgs): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiUrl = process.env.EMAIL_API_URL?.trim();
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiUrl) {
    return { ok: false, message: "EMAIL_API_URL is not configured." };
  }
  if (!apiKey) {
    return { ok: false, message: "EMAIL_API_KEY is not configured." };
  }
  if (!from) {
    return { ok: false, message: "EMAIL_FROM is not configured." };
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [parentEmail],
      subject: `Approve ${childUsername}'s Ollie Code account`,
      html: parentApprovalHtml(childUsername, approvalUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, message: body || `Email API error ${res.status}` };
  }

  return { ok: true };
}

function parentApprovalHtml(childUsername: string, approvalUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111827;">
  <p>Someone requested an Ollie Code account for the codename <strong>${escapeHtml(childUsername)}</strong>.</p>
  <p>If you approve, click the button below to create the account. If you did not expect this, you can ignore this email.</p>
  <p><a href="${escapeHtml(approvalUrl)}" style="display: inline-block; padding: 12px 24px; background: #84c126; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold;">Approve account</a></p>
  <p style="font-size: 12px; color: #6b7280;">Or paste this link: ${escapeHtml(approvalUrl)}</p>
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
