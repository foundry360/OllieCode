import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase session and merges auth cookies onto the response.
 * Unauthenticated users hitting `/workspace` are sent to login.
 */
export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    /**
     * Use `getSession()` here, not `getUser()`. `getUser()` always hits the Auth API and parses
     * JSON; flaky/empty error bodies can throw `SyntaxError: Unexpected end of JSON input` and
     * 500 the request before our catch runs in some runtimes. `getSession()` reads the cookie
     * session (still refreshed by this client) and is the usual middleware gate for “signed in”.
     */
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const path = request.nextUrl.pathname;
    /** Only enforce login when Supabase is configured (otherwise workspace stays usable offline). */
    if (env && !session && path.startsWith("/workspace")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", "/workspace");
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value);
      });
      return redirectResponse;
    }

    return supabaseResponse;
  } catch (err) {
    /**
     * Corrupted or truncated auth cookies can make `@supabase/ssr` decode/JSON.parse throw
     * (`Unexpected end of JSON input`), which would 500 the whole page. Continue the request
     * and drop Supabase cookies so the next navigation does not retry poisoned chunks.
     */
    console.warn("[supabase middleware] updateSession failed, continuing:", err);
    const res = NextResponse.next({ request });
    for (const { name } of request.cookies.getAll()) {
      if (name.startsWith("sb-")) {
        res.cookies.set(name, "", {
          path: "/",
          maxAge: 0,
          sameSite: "lax",
        });
      }
    }
    return res;
  }
}
