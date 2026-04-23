"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "syncing" | "done" | "error" | "no_session";

/** Bump when replacing `public/images/workspace-welcome-robot-celebrating.png` so clients skip cache. */
const WORKSPACE_WELCOME_ROBOT_SRC = `/images/workspace-welcome-robot-celebrating.png?v=20260424`;

export function WorkspaceWelcomeClient() {
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setPhase("error");
        setMessage(data.error || "We could not confirm your subscription yet.");
        return;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ollie_post_checkout_session", sessionId);
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
          Welcome
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">
          If you just finished subscribing, return from your payment confirmation link, or open the
          workspace from your account.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/workspace"
            className="inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto"
          >
            Launch Workspace
          </a>
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
          Finishing up…
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">
          Confirming your subscription—almost ready to build.
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
          Wait a moment for your subscription to sync, then try launching the workspace again.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/workspace"
            className="inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto"
          >
            Launch Workspace
          </a>
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

  return (
    <>
      <div className="mx-auto mb-4 w-full max-w-[200px] sm:mb-5 sm:max-w-[240px]">
        <Image
          src={WORKSPACE_WELCOME_ROBOT_SRC}
          alt="Ollie bot celebrating your new subscription"
          width={480}
          height={480}
          className="h-auto w-full object-contain"
          priority
          unoptimized
        />
      </div>
      <h1 className="font-section text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
        You are all set!
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[#6b7280] sm:text-lg">
        Your subscription is active. Jump into the workspace to keep creating, saving, and sharing
        your projects.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="/workspace"
          className="inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto"
        >
          Launch Workspace
        </a>
      </div>
    </>
  );
}
