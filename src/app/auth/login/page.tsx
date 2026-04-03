"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Auth placeholder — wire to Supabase Auth (email/password or magic link).
 * Magic link: supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: origin + '/auth/callback' } })
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "Signed in — go to the workspace!");
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg("Configure Supabase env vars first.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/workspace` },
    });
    setMsg(error ? error.message : "Check your email for the magic link.");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f8fafc] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-[#111827]">Sign in</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Parents &amp; kids — use email or ask your teacher for an account.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleEmailPassword}>
          <label className="text-sm font-semibold text-[#374151]">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2"
              autoComplete="email"
              required
            />
          </label>
          <label className="text-sm font-semibold text-[#374151]">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#84c126] py-3 font-bold text-white shadow hover:bg-[#6fa020]"
          >
            Sign in with password
          </button>
        </form>
        <button
          type="button"
          onClick={handleMagicLink}
          className="mt-3 w-full rounded-xl border border-[#e5e7eb] py-3 font-bold text-[#111827] hover:bg-[#f9fafb]"
        >
          Email me a magic link
        </button>
        {msg ? <p className="mt-4 text-sm text-[#374151]">{msg}</p> : null}
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-[#84c126] font-semibold hover:underline">
            ← Back home
          </Link>
          {" · "}
          <Link href="/workspace" className="font-semibold text-[#111827] hover:underline">
            Try workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
