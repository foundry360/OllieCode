"use server";

import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/admin/isAdminUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InboxActionResult = { ok: true } | { ok: false; message: string };

export async function markContactInboxReadAction(
  id: string,
  read: boolean,
): Promise<InboxActionResult> {
  const idTrim = id.trim();
  if (!idTrim) {
    return { ok: false, message: "Missing message id." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "No database." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }
  if (!(await isAdminUser(supabase, user))) {
    return { ok: false, message: "Forbidden." };
  }

  const { error } = await supabase
    .from("contact_inbox_messages")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", idTrim);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/messages");
  return { ok: true };
}
