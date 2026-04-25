"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  LayoutDashboard,
  Library,
  PanelsTopLeft,
  PlusCircle,
  UsersRound,
} from "lucide-react";

const PRODUCT_LINKS: { href: string; label: string; icon: typeof Library }[] = [
  { href: "/learn", label: "Learning Hub", icon: Library },
  { href: "/workspace", label: "Workspace", icon: PanelsTopLeft },
];

const SECTIONS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Match only exact path (e.g. dashboard). */
  exact?: boolean;
  /** When set, this path prefix is excluded from “starts with” matches (e.g. new-lesson flow). */
  excludePrefix?: string;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/learners", label: "Learners", icon: UsersRound },
  {
    href: "/admin/lessons",
    label: "Lessons",
    icon: BookOpen,
    excludePrefix: "/admin/lessons/new",
  },
];

function isActivePath(
  pathname: string,
  href: string,
  exact?: boolean,
  excludePrefix?: string,
): boolean {
  const norm = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (excludePrefix && (norm === excludePrefix || norm.startsWith(`${excludePrefix}/`))) {
    return false;
  }
  if (exact) return norm === h;
  return norm === h || norm.startsWith(`${h}/`);
}

export function AdminSidebar() {
  const pathname = usePathname() || "";

  const linkClass = (active: boolean) =>
    [
      "flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:min-h-0 md:py-2",
      active
        ? "bg-[#ecfccb] text-[#365314] ring-1 ring-[#84c126]/30"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");

  const productLinkClass =
    "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:min-h-0 md:py-2";

  return (
    <aside className="shrink-0 border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r md:border-slate-200">
      <nav
        className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:gap-0.5 md:px-4 md:py-5"
        aria-label="Admin navigation"
      >
        <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400 md:block">
          Admin
        </p>
        {SECTIONS.map(({ href, label, icon: Icon, exact, excludePrefix }) => {
          const active = isActivePath(pathname, href, exact, excludePrefix);
          return (
            <Link
              key={href}
              href={href}
              className={linkClass(active)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
        <Link
          href="/admin/lessons/new"
          className={`${linkClass(pathname.startsWith("/admin/lessons/new"))} md:ml-2 md:mt-1 md:border-l-2 md:border-[#84c126]/25 md:pl-3`}
          aria-current={pathname.startsWith("/admin/lessons/new") ? "page" : undefined}
        >
          <PlusCircle className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          New lesson
        </Link>
        <div
          className="hidden h-px bg-slate-200 md:mx-3 md:my-3 md:block"
          role="presentation"
        />
        <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400 md:block">
          Product
        </p>
        {PRODUCT_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={`${label} (opens in a new tab)`}
            className={productLinkClass}
          >
            <Icon className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
            <span className="min-w-0 flex-1">{label}</span>
            <ExternalLink className="size-3.5 shrink-0 opacity-50" strokeWidth={2} aria-hidden />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
