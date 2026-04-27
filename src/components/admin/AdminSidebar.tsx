"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Library,
  PanelsTopLeft,
  UsersRound,
} from "lucide-react";

const STORAGE_KEY = "ollie-admin-sidebar-collapsed";

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
  { href: "/admin/lessons", label: "Lessons", icon: BookOpen },
  { href: "/admin/guides", label: "Learning Guides", icon: BookMarked },
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

function cn(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function AdminSidebar() {
  const pathname = usePathname() || "";
  const navId = useId();
  const toggleId = `${navId}-toggle`;

  const [collapsed, setCollapsed] = useState(false);
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
    setPersistReady(true);
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, persistReady]);

  const toggle = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:min-h-0 md:py-2",
      collapsed && "md:justify-center md:gap-0 md:px-2",
      active
        ? "bg-[#ecfccb] text-[#365314] ring-1 ring-[#84c126]/30"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    );

  const productLinkClass = cn(
    "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:min-h-0 md:py-2",
    collapsed && "md:justify-center md:gap-0 md:px-2",
  );

  const sectionHeadingClass = cn(
    "hidden px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400 md:block",
    collapsed && "md:hidden",
  );

  const dividerClass = cn(
    "hidden h-px bg-slate-200 md:mx-3 md:my-3 md:block",
    collapsed && "md:hidden",
  );

  return (
    <aside
      className={cn(
        "shrink-0 border-b border-slate-200 bg-white transition-[width] duration-200 ease-out md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden md:border-b-0 md:border-r md:border-slate-200",
        collapsed ? "md:w-16" : "md:w-56",
      )}
    >
      <nav
        id={navId}
        className={cn(
          "flex gap-1 overflow-x-auto overflow-y-hidden px-3 py-2 md:min-h-0 md:flex-1 md:flex-col md:gap-0.5 md:overflow-hidden md:py-5",
          collapsed ? "md:px-2" : "md:px-4",
        )}
        aria-label="Admin navigation"
      >
        <p className={sectionHeadingClass}>Admin</p>
        {SECTIONS.map(({ href, label, icon: Icon, exact, excludePrefix }) => {
          const active = isActivePath(pathname, href, exact, excludePrefix);
          return (
            <Link
              key={href}
              href={href}
              className={linkClass(active)}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              <span className={cn(collapsed && "md:sr-only")}>{label}</span>
            </Link>
          );
        })}
        <div className={dividerClass} role="presentation" />
        <p className={sectionHeadingClass}>Product</p>
        {PRODUCT_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? `${label} (opens in a new tab)` : undefined}
            className={productLinkClass}
          >
            <Icon className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
            <span className={cn("min-w-0 flex-1", collapsed && "md:sr-only")}>{label}</span>
            <ExternalLink
              className={cn("size-3.5 shrink-0 opacity-50", collapsed && "md:hidden")}
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        ))}
      </nav>

      <button
        id={toggleId}
        type="button"
        onClick={toggle}
        className="hidden w-full shrink-0 items-center justify-center border-t border-slate-200 bg-slate-50/80 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:flex"
        aria-expanded={!collapsed}
        aria-controls={navId}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
        ) : (
          <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
        )}
        <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
      </button>
    </aside>
  );
}
