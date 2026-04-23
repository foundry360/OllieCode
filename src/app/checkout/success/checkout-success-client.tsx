"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "syncing" | "done" | "error" | "no_session";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";

  const [phase, setPhase] = useState<Phase>(() =>
    sessionId.startsWith("cs_") ? "syncing" : "no_session",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId.startsWith("cs_")) {
      setPhase("no_session");
      return;
    }

    let cancelled = false;

    async function run() {
      const res = await fetch("/api/billing/confirm-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; subscription_status?: string };
      if (cancelled) return;
      if (!res.ok) {
        setPhase("error");
        setMessage(data.error || "We could not confirm your subscription yet.");
        return;
      }
      setPhase("done");
      setMessage(null);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (phase === "no_session") {
    return (
      <>
        <h1 className="font-section text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
          Thanks for visiting
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">
          If you just finished checkout, open the link from Stripe again, or sign in and go to{" "}
          <strong>Plans</strong> to manage your subscription.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login?next=%2Fworkspace"
            className="inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto"
          >
            Sign in
          </Link>
          <Link
            href="/plans"
            className="text-sm font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827]"
          >
            View plans
          </Link>
        </div>
      </>
    );
  }

  if (phase === "syncing") {
    return (
      <>
        <h1 className="font-section text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
          Finishing setup…
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">
          Linking your subscription to your account. This only takes a moment.
        </p>
      </>
    );
  }

  if (phase === "error") {
    return (
      <>
        <h1 className="font-section text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
          Almost there
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">{message}</p>
        <p className="mt-2 text-sm text-[#6b7280]">
          Make sure you are signed in with the same account you used to subscribe. You can also wait
          a minute for your subscription to sync, then try opening the workspace again.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login?next=%2Fworkspace"
            className="inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto"
          >
            Sign in
          </Link>
          <Link
            href="/workspace"
            className="text-sm font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827]"
          >
            Try workspace again
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-section text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
        Welcome aboard
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">
        Your subscription is linked. You can open the workspace whenever you are ready.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/workspace"
          className="inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto"
        >
          Open workspace
        </Link>
        <Link
          href="/plans"
          className="text-sm font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827]"
        >
          Back to plans
        </Link>
      </div>
    </>
  );
}
