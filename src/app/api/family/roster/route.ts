import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type FamilyRosterMember = {
  userId: string;
  username: string | null;
  isMaster: boolean;
};

/**
 * Lists Family roster members for the household the signed-in user belongs to
 * (master or sibling). Requires service role to resolve usernames for all members.
 */
export async function GET() {
  const admin = getSupabaseAdmin();
  const supabase = await createSupabaseServerClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data: myProfile } = await admin
    .from("profiles")
    .select("billing_master_user_id")
    .eq("id", user.id)
    .maybeSingle();

  const masterId =
    typeof myProfile?.billing_master_user_id === "string" &&
    myProfile.billing_master_user_id.trim()
      ? myProfile.billing_master_user_id.trim()
      : user.id;

  const { data: rosterRows, error: rosterErr } = await admin
    .from("family_group_members")
    .select("member_user_id")
    .eq("master_user_id", masterId);

  if (rosterErr) {
    console.error("[family/roster]", rosterErr.message);
    return NextResponse.json({ error: "Could not load roster." }, { status: 502 });
  }

  const memberIds = [...new Set((rosterRows ?? []).map((r) => r.member_user_id as string))];
  if (!memberIds.length) {
    return NextResponse.json({ masterUserId: masterId, members: [] satisfies FamilyRosterMember[] });
  }

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, username")
    .in("id", memberIds);

  if (profErr) {
    console.error("[family/roster] profiles", profErr.message);
    return NextResponse.json({ error: "Could not load profiles." }, { status: 502 });
  }

  const usernameById = new Map((profiles ?? []).map((p) => [p.id as string, p.username as string | null]));

  const members: FamilyRosterMember[] = memberIds.map((id) => ({
    userId: id,
    username: usernameById.get(id) ?? null,
    isMaster: id === masterId,
  }));

  members.sort((a, b) => {
    if (a.isMaster !== b.isMaster) return a.isMaster ? -1 : 1;
    return (a.username ?? a.userId).localeCompare(b.username ?? b.userId);
  });

  return NextResponse.json({ masterUserId: masterId, members });
}
