import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workspace | Ollie Code",
  description: "Build games and code with blocks.",
};

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return children;
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    redirect(`/auth/login?next=${encodeURIComponent("/workspace")}`);
  }

  return children;
}
