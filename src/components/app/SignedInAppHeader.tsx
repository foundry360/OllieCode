"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/app/SignOutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

type HeaderUser = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

function readHeaderUser(user: User): HeaderUser {
  const meta = user.user_metadata as Record<string, unknown>;
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) ||
    (typeof meta.picture === "string" && meta.picture.trim()) ||
    null;
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    null;
  return { email: user.email ?? null, name, avatarUrl };
}

function initialsFromUser(email: string | null, name: string | null): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0]?.[0];
      const b = parts[parts.length - 1]?.[0];
      if (a && b) return `${a}${b}`.toUpperCase();
    }
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
    if (parts[0]?.[0]) return parts[0][0]!.toUpperCase();
  }
  const e = email?.trim();
  if (e && e.length >= 2) return e.slice(0, 2).toUpperCase();
  if (e?.[0]) return e[0].toUpperCase();
  return "?";
}

function AdminHeaderAvatar() {
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    const apply = (u: User | null) => {
      setUser(u ? readHeaderUser(u) : null);
    };

    void sb.auth.getSession().then(({ data: { session } }) => {
      apply(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <span
        className="size-9 shrink-0 rounded-full bg-white/10 ring-2 ring-white/15"
        aria-hidden
      />
    );
  }

  const label = user.name?.trim() || user.email?.trim() || "Signed-in user";
  const initials = initialsFromUser(user.email, user.name);

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={label}
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white/20"
        referrerPolicy="no-referrer"
        title={label}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold uppercase tracking-wide text-white ring-2 ring-white/20"
    >
      {initials}
    </span>
  );
}

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
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <SignOutButton
              tone={adminPortal ? "admin" : effectiveTone === "learn" ? "learn" : "default"}
            />
            {adminPortal ? <AdminHeaderAvatar /> : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
