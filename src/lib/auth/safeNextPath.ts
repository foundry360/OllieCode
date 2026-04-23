/**
 * Returns a safe same-origin path+query for post-auth redirects.
 * Rejects open redirects (`//evil.com`) and non-path values.
 */
export function safeNextPath(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t.startsWith("/") || t.startsWith("//")) {
    return "/workspace";
  }
  try {
    const u = new URL(t, "https://placeholder.local");
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return "/workspace";
  }
}
