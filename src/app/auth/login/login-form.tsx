"use client";

import { OllieLogoLink } from "@/components/auth/OllieLogoLink";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { resolvePostLoginPath } from "@/lib/auth/postLoginRedirect";
import { safeNextPath } from "@/lib/auth/safeNextPath";
import { usernameToAuthEmail } from "@/lib/auth/authEmailDomain";
import {
  normalizeUsername,
  validateUsernameNormalized,
} from "@/lib/profiles/username";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function usernameToSignInEmail(raw: string): string {
  return usernameToAuthEmail(normalizeUsername(raw));
}

async function mergeWorkspaceEntitlement(
  profile: { subscription_status: string | null; is_admin: boolean | null } | null,
): Promise<{ subscription_status: string | null; is_admin: boolean | null } | null> {
  if (!profile) return profile;
  try {
    const entRes = await fetch("/api/profile/workspace-entitlement", { cache: "no-store" });
    if (!entRes.ok) return profile;
    const ent = (await entRes.json()) as { entitled?: boolean; subscription_status?: string | null };
    if (ent.entitled && typeof ent.subscription_status === "string") {
      return { ...profile, subscription_status: ent.subscription_status };
    }
  } catch {
    /* ignore */
  }
  return profile;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = useMemo(() => safeNextPath(nextParam), [nextParam]);

  const [codename, setCodename] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [urlError, setUrlError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = searchParams.get("error");
    if (e) setUrlError(decodeURIComponent(e));
  }, [searchParams]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status,is_admin")
        .eq("id", user.id)
        .maybeSingle();
      router.replace(resolvePostLoginPath(next, await mergeWorkspaceEntitlement(profile)));
      router.refresh();
    })();
  }, [router, next]);

  function validateCodenameField(raw: string): string | null {
    const t = raw.trim();
    if (!t) return "Enter your codename.";
    return validateUsernameNormalized(normalizeUsername(t));
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }

    const idErr = validateCodenameField(codename);
    if (idErr) {
      setMsg(idErr);
      return;
    }

    const email = usernameToSignInEmail(codename);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(error.message);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(next);
        router.refresh();
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status,is_admin")
        .eq("id", user.id)
        .maybeSingle();
      router.replace(resolvePostLoginPath(next, await mergeWorkspaceEntitlement(profile)));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg("Configure Supabase env vars first.");
      return;
    }
    const idErr = validateCodenameField(codename);
    if (idErr) {
      setMsg(idErr);
      return;
    }
    const email = usernameToSignInEmail(codename);

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
      });
      setMsg(
        error
          ? error.message
          : "If that account exists, we sent a link to reset the password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <OllieLogoLink className="mb-6 mx-auto" />
      <h1 className="font-display text-2xl font-bold text-[#111827]">Sign in</h1>
      <p className="mt-2 text-sm text-[#6b7280]">
        Sign in with your codename and password.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        autoComplete="off"
        onSubmit={handlePasswordAuth}
      >
        <label className="text-sm font-semibold text-[#374151]">
          Codename
          <input
            type="text"
            name="codename"
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base lowercase text-[#111827]"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <label className="text-sm font-semibold text-[#374151]">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
            autoComplete="off"
            required
            minLength={6}
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={handleForgotPassword}
            className="text-sm font-semibold text-[#84c126] hover:underline disabled:opacity-50"
          >
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#84c126] py-3 font-bold text-white shadow hover:bg-[#6fa020] disabled:opacity-60"
        >
          {loading ? "Please wait…" : "Sign in"}
        </button>
      </form>

      {urlError ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {urlError}
        </p>
      ) : null}
      {msg ? (
        <p className="mt-4 text-sm text-[#374151]" role="status">
          {msg}
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm">
        New here?{" "}
        <Link
          href={`/auth/signup?next=${encodeURIComponent(next)}`}
          className="font-semibold text-[#84c126] hover:underline"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/" className="font-semibold text-[#84c126] hover:underline">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
