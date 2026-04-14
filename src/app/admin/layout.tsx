import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminAppHeader } from "@/components/app/AdminAppHeader";
import { Footer } from "@/components/landing/Footer";
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
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc] text-slate-900">
      <AdminAppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
