"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  /** Matches {@link SignedInAppHeader} lime vs white vs admin (dark) header */
  tone?: "learn" | "default" | "admin";
};

export function SignOutButton({ tone = "default" }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const handle = async () => {
    const s = getSupabaseBrowserClient();
    await s?.auth.signOut();
    router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
    router.refresh();
  };

  const cls =
    tone === "admin"
      ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
      : tone === "learn"
        ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#374151] transition hover:bg-white/70 hover:text-[#84c126]"
        : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#374151] transition hover:bg-slate-100 hover:text-[#84c126]";

  return (
    <button type="button" onClick={handle} className={cls} aria-label="Log out">
      <LogOut className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      Log out
    </button>
  );
}
