import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminUser } from "@/lib/admin/isAdminUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin | Ollie Code",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(
      "/staff/login?error=" +
        encodeURIComponent(
          "Add Supabase environment variables to use the admin portal.",
        ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/staff/login?next=/admin");
  }

  if (!(await isAdminUser(supabase, user))) {
    redirect(
      "/staff/login?admin_denied=1&error=" +
        encodeURIComponent(
          "This account is not an admin. In Supabase SQL, run: update public.profiles set is_admin = true where id = '<your User UID from Authentication → Users>'. The row must be in public.profiles (not only auth.users). Or set OLLIE_ADMIN_USERNAMES in .env.",
        ),
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/admin"
              className="font-display text-lg font-bold text-[#84c126]"
            >
              Admin portal
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
              <Link href="/admin" className="hover:text-[#84c126]">
                Dashboard
              </Link>
              <Link href="/admin/lessons" className="hover:text-[#84c126]">
                Lessons
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/learn"
              className="font-semibold text-slate-600 hover:text-[#84c126]"
            >
              Learning Hub
            </Link>
            <Link
              href="/"
              className="font-semibold text-slate-600 hover:text-[#84c126]"
            >
              Home
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
