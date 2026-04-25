import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminAppHeader } from "@/components/app/AdminAppHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
    redirect("/staff/login?admin_denied=1&next=/admin");
  }

  return (
    <div className="ollie-admin flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#f8fafc] text-slate-900">
      <div className="shrink-0">
        <AdminAppHeader />
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden md:flex-row">
        <AdminSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
