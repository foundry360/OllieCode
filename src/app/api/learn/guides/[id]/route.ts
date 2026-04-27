import { NextResponse } from "next/server";
import { fetchLearningGuideByIdForViewer } from "@/lib/lms/learningGuides";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Single learning guide JSON (RLS: published for anon/auth; platform admins may see drafts). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId).trim();
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = await fetchLearningGuideByIdForViewer(supabase, id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    bodyHtml: sanitizeLessonBodyHtml(row.body_html),
    updatedAt: row.updated_at,
  });
}
