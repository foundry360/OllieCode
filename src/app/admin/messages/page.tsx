import { MessagesInbox, type ContactInboxRow } from "@/app/admin/messages/messages-inbox";
import { isContactInboxMissing } from "@/lib/admin/contactInbox";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminMessagesPage() {
  let rows: ContactInboxRow[] = [];
  let listError: string | null = null;

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("contact_inbox_messages")
      .select("id, created_at, visitor_name, visitor_email, message, read_at, auth_user_id")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) listError = error.message;
    else rows = (data ?? []) as ContactInboxRow[];
  } else {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("contact_inbox_messages")
        .select("id, created_at, visitor_name, visitor_email, message, read_at, auth_user_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) listError = error.message;
      else rows = (data ?? []) as ContactInboxRow[];
    }
  }

  const tableMissing = isContactInboxMissing(listError);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-600">
          Notes from the site contact form. Select a row to read the full message.
        </p>
      </div>

      {listError && tableMissing ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/90 px-5 py-5 text-sm leading-relaxed text-sky-950 shadow-sm">
          <p className="font-display text-base font-bold text-sky-950">Inbox table not found</p>
          <p className="mt-2 text-sky-900">
            The <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">contact_inbox_messages</code>{" "}
            table is not in this Supabase project yet. Apply migrations (e.g.{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
              supabase/migrations/20260430210000_contact_inbox_messages.sql
            </code>
            ), then reload the schema in the Supabase Dashboard if needed.
          </p>
        </div>
      ) : listError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Could not load messages: {listError}
        </p>
      ) : (
        <MessagesInbox initialMessages={rows} />
      )}
    </div>
  );
}
