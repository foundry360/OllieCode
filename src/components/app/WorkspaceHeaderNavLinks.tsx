"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-semibold transition ${
    active
      ? "bg-[#84c126] text-white shadow-sm"
      : "text-[#374151] hover:bg-slate-100 hover:text-[#84c126]"
  }`;

export function WorkspaceHeaderNavLinks() {
  const path = usePathname() ?? "";
  return (
    <nav
      className="hidden items-center gap-1 sm:flex"
      aria-label="App sections"
    >
      <Link
        href="/learn"
        className={linkClass(path.startsWith("/learn"))}
        aria-current={path.startsWith("/learn") ? "page" : undefined}
      >
        Learning Hub
      </Link>
    </nav>
  );
}
