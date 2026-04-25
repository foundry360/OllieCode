"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/app/SignOutButton";

export type SignedInNavId = "learn" | "workspace" | "profile" | "settings";

type SignedInAppHeaderProps = {
  active?: SignedInNavId;
  /** Learning Hub uses the lime header; other signed-in areas use a white header. */
  tone?: "learn" | "default";
  /** Admin portal: #111727 header + blue logo; admin/product links in sidebar. */
  adminPortal?: boolean;
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
  adminPortal,
}: SignedInAppHeaderProps) {
  const effectiveTone = tone;
  const headerTone = adminPortal
    ? "border-b border-white/10 bg-[#111727] backdrop-blur"
    : effectiveTone === "learn"
      ? "border-b border-[#d9f99d] bg-[#ecfccb]/95 backdrop-blur"
      : "border-b border-slate-200 bg-white/95 backdrop-blur";
  const inactiveNav =
    effectiveTone === "learn"
      ? "text-[#374151] hover:bg-white/70 hover:text-[#84c126]"
      : "text-[#374151] hover:bg-slate-100 hover:text-[#84c126]";

  const navItems = adminPortal ? [] : NAV;

  return (
    <header className={`sticky top-0 z-40 ${headerTone}`}>
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="block shrink-0"
          aria-label="Ollie Code home"
        >
          <Image
            src={adminPortal ? "/images/logo_blue.png" : "/images/logo.png"}
            alt=""
            width={434}
            height={91}
            className={adminPortal ? "h-8 w-auto sm:h-9" : "h-7 w-auto sm:h-8"}
            priority
          />
        </Link>
        <nav
          className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2"
          aria-label={adminPortal ? "Admin session" : "Signed-in navigation"}
        >
          {navItems.map((item) => {
            const isActive = active === item.id;
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
              >
                {item.label}
              </Link>
            );
          })}
          <SignOutButton
            tone={adminPortal ? "admin" : effectiveTone === "learn" ? "learn" : "default"}
          />
        </nav>
      </div>
    </header>
  );
}
