import type { NextRequest } from "next/server";

/**
 * Stripe success/cancel URLs must be absolute. Prefer `NEXT_PUBLIC_SITE_URL` in production.
 */
export function absoluteUrl(request: NextRequest, path: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return `${configured}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ||
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
  }

  return `http://localhost:3000${path.startsWith("/") ? path : `/${path}`}`;
}
