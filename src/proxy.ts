import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function clearSupabaseCookiesOn(response: NextResponse, request: NextRequest) {
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) {
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }
  }
}

/** Next.js 16+ — replaces `middleware.ts` (same matcher + Supabase session refresh). */
export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err) {
    /**
     * Belt-and-suspenders: anything that escapes `updateSession` (e.g. a thrown non-Error in an
     * edge path) must not turn `/workspace` into a 500.
     */
    console.warn("[proxy] updateSession threw, continuing without auth:", err);
    const res = NextResponse.next({ request });
    clearSupabaseCookiesOn(res, request);
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
