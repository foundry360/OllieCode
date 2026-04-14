"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/app/SignOutButton";

export type SignedInNavId = "learn" | "workspace" | "profile" | "settings";

export type AdminHeaderSection = "dashboard" | "lessons";

type SignedInAppHeaderProps = {
  active?: SignedInNavId;
  /** Learning Hub uses the lime header; other signed-in areas use a white header. Ignored when {@link admin} is set (admin always uses lime). */
  tone?: "learn" | "default";
  /** Admin portal: same shell as Learning Hub + Dashboard / Lessons before main nav */
  admin?: { active: AdminHeaderSection };
};

const NAV: { id: SignedInNavId; href: string; label: string }[] = [
  { id: "learn", href: "/learn", label: "Learning Hub" },
  { id: "workspace", href: "/workspace", label: "Workspace" },
  { id: "profile", href: "/profile", label: "Profile" },
  { id: "settings", href: "/settings", label: "Settings" },
];

export function SignedInAppHeader({
  active,
  tone = "default",
  admin,
}: SignedInAppHeaderProps) {
  const effectiveTone = admin ? "learn" : tone;
  const headerTone =
    effectiveTone === "learn"
      ? "border-b border-[#d9f99d] bg-[#ecfccb]/95 backdrop-blur"
      : "border-b border-slate-200 bg-white/95 backdrop-blur";
  const inactiveNav =
    effectiveTone === "learn"
      ? "text-[#374151] hover:bg-white/70 hover:text-[#84c126]"
      : "text-[#374151] hover:bg-slate-100 hover:text-[#84c126]";

  return (
    <header className={`sticky top-0 z-40 ${headerTone}`}>
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="block shrink-0"
          aria-label="Ollie Code home"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={434}
            height={91}
            className="h-7 w-auto sm:h-8"
            priority
          />
        </Link>
        <nav
          className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2"
          aria-label={admin ? "Admin and app navigation" : "Signed-in navigation"}
        >
          {admin ? (
            <>
              <Link
                href="/admin"
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  admin.active === "dashboard"
                    ? "bg-[#84c126] text-white shadow-sm"
                    : inactiveNav
                }`}
                aria-current={admin.active === "dashboard" ? "page" : undefined}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/lessons"
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  admin.active === "lessons"
                    ? "bg-[#84c126] text-white shadow-sm"
                    : inactiveNav
                }`}
                aria-current={admin.active === "lessons" ? "page" : undefined}
              >
                Lessons
              </Link>
            </>
          ) : null}
          {NAV.map((item) => {
            const isActive = active === item.id;
            const learningHubFromAdmin = Boolean(admin && item.id === "learn");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#84c126] text-white shadow-sm"
                    : inactiveNav
                }`}
                aria-current={isActive ? "page" : undefined}
                {...(learningHubFromAdmin
                  ? {
                      target: "_blank",
                      rel: "noopener noreferrer",
                      title: "Open Learning Hub in a new tab",
                    }
                  : {})}
              >
                {item.label}
              </Link>
            );
          })}
          <SignOutButton tone={effectiveTone === "learn" ? "learn" : "default"} />
        </nav>
      </div>
    </header>
  );
}
