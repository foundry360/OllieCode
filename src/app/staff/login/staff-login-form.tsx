"use client";

import { OllieLogoLink } from "@/components/auth/OllieLogoLink";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getAuthEmailDomain,
  usernameToAuthEmail,
} from "@/lib/auth/authEmailDomain";
import {
  normalizeUsername,
  validateUsernameNormalized,
} from "@/lib/profiles/username";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_AFTER_LOGIN = "/admin";

function staffNextPath(searchParams: URLSearchParams): string {
  const raw = searchParams.get("next");
  if (raw?.startsWith("/admin")) return raw;
  return DEFAULT_AFTER_LOGIN;
}

/**
 * Learner codenames map to synthetic emails; staff may also use the real Auth email
 * (e.g. if the user was created in the Supabase dashboard with a normal address).
 */
function resolveStaffSignInEmail(raw: string): { email: string } | { error: string } {
  const t = raw.trim();
  if (!t) return { error: "Enter your codename or email." };
  if (t.includes("@")) {
    const email = t.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Enter a valid email address." };
    }
    return { email };
  }
  const idErr = validateUsernameNormalized(normalizeUsername(t));
  if (idErr) return { error: idErr };
  return { email: usernameToAuthEmail(normalizeUsername(t)) };
}

export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterLogin = staffNextPath(searchParams);
  const [codename, setCodename] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [urlError, setUrlError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedInNonAdmin, setSignedInNonAdmin] = useState(false);

  const adminDenied = searchParams.get("admin_denied") === "1";

  useEffect(() => {
    if (adminDenied) {
      setUrlError("");
      return;
    }
    const e = searchParams.get("error");
    if (e) setUrlError(decodeURIComponent(e));
  }, [searchParams, adminDenied]);

  useEffect(() => {
    if (!adminDenied) {
      setSignedInNonAdmin(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setSignedInNonAdmin(Boolean(user));
    });
  }, [adminDenied]);

  useEffect(() => {
    /** Avoid loop: /admin sends non-admins here with `admin_denied=1`; do not bounce back to /admin. */
    if (searchParams.get("admin_denied") === "1") return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(afterLogin);
    });
  }, [router, afterLogin, searchParams]);

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg(
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      );
      return;
    }

    const resolved = resolveStaffSignInEmail(codename);
    if ("error" in resolved) {
      setMsg(resolved.error);
      return;
    }
    const email = resolved.email;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        let m = error.message;
        const usedCodenameOnly = !codename.trim().includes("@");
        const looksAuthFail = /invalid login|invalid credentials|email not confirmed/i.test(
          error.message,
        );
        if (usedCodenameOnly && looksAuthFail) {
          const domain = getAuthEmailDomain();
          m = `${error.message} Codename-only signs in as yourname@${domain}. If your user in Supabase Authentication uses another email (e.g. a work address), use that full email here instead.`;
        }
        setMsg(m);
        return;
      }
      router.replace(afterLogin);
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
    const resolved = resolveStaffSignInEmail(codename);
    if ("error" in resolved) {
      setMsg(resolved.error);
      return;
    }
    const email = resolved.email;

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
      <OllieLogoLink className="mx-auto mb-6" />
      <p className="text-center text-xs font-bold uppercase tracking-widest text-[#6b9e1f]">
        Staff only
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-[#111827]">
        Team sign in
      </h1>
      <p className="mt-2 text-sm text-[#6b7280]">
        Sign in with your Ollie codename (letters, numbers, underscores) or the
        same email you use in Supabase Auth. This page is separate from learner
        sign-in.
      </p>

      {adminDenied ? (
        <div
          className="mt-6 rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50 to-[#fffbeb] px-4 py-4 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100"
          role="status"
        >
          <p className="font-display text-base font-bold text-amber-950">
            This account can’t open the staff portal yet
          </p>
          {signedInNonAdmin ? (
            <button
              type="button"
              disabled={loading}
              className="mt-4 w-full rounded-xl border border-amber-300/80 bg-white/90 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-50 disabled:opacity-60"
              onClick={async () => {
                setLoading(true);
                try {
                  const s = getSupabaseBrowserClient();
                  await s?.auth.signOut();
                  setSignedInNonAdmin(false);
                  setMsg("You’re signed out. Sign in with a staff-enabled account.");
                  router.replace("/staff/login");
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
            >
              Sign out and use another account
            </button>
          ) : null}
        </div>
      ) : null}

      <form
        className="mt-6 flex flex-col gap-4"
        autoComplete="off"
        onSubmit={handlePasswordAuth}
      >
        <label className="text-sm font-semibold text-[#374151]">
          Codename or email
          <input
            type="text"
            name="staff-codename"
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
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
            name="staff-password"
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
          className="rounded-xl bg-[#365314] py-3 font-bold text-white shadow hover:bg-[#2a3f0f] disabled:opacity-60"
        >
          {loading ? "Please wait…" : "Admin Login"}
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

      <p className="mt-8 text-center text-sm text-[#6b7280]">
        Looking for the kids’ workspace?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-[#84c126] hover:underline"
        >
          Learner sign in
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
