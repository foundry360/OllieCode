/**
 * Synthetic Supabase Auth email: `{username}@{domain}`.
 * Set NEXT_PUBLIC_AUTH_EMAIL_DOMAIN to a stable value (e.g. users.yourdomain.com).
 */
export function getAuthEmailDomain(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN?.trim() || "users.olliecode.app"
  );
}

export function usernameToAuthEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${getAuthEmailDomain()}`;
}

/** Local part before `@` — matches codename for synthetic auth emails. */
export function authEmailLocalPart(email: string | null | undefined): string {
  if (!email) return "";
  const i = email.indexOf("@");
  return i === -1 ? email : email.slice(0, i);
}
