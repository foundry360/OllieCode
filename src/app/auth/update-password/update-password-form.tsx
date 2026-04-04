"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setChecked(true);
      setMsg("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
      setChecked(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg("Supabase is not configured.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMsg(error.message);
        return;
      }
      router.replace("/workspace");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!checked) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
        <p className="text-sm text-[#6b7280]">Loading…</p>
      </div>
    );
  }

  if (!getSupabaseBrowserClient()) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
        <p className="text-sm text-[#374151]">{msg}</p>
        <p className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="font-semibold text-[#84c126] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-[#111827]">Set a new password</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          This page only works after you open the link from your password reset email. If the link
          expired, request a new one from sign in.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/auth/login"
            className="font-semibold text-[#84c126] hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
      <h1 className="font-display text-2xl font-bold text-[#111827]">Choose a new password</h1>
      <p className="mt-2 text-sm text-[#6b7280]">Enter it twice so we know it&apos;s typed right.</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="text-sm font-semibold text-[#374151]">
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        <label className="text-sm font-semibold text-[#374151]">
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#84c126] py-3 font-bold text-white shadow hover:bg-[#6fa020] disabled:opacity-60"
        >
          {loading ? "Please wait…" : "Update password"}
        </button>
      </form>

      {msg ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {msg}
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm">
        <Link href="/auth/login" className="font-semibold text-[#84c126] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
