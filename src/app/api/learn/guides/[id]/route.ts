import { NextResponse } from "next/server";
import {
  fetchLearningGuideByIdForViewer,
  getBuiltinLearningGuideDetailForViewer,
} from "@/lib/lms/learningGuides";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Single learning guide for the hub modal (RLS: published or platform admin).
 * Built-in guides are returned when the row is missing (e.g. migration not applied).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId).trim();
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const builtin = getBuiltinLearningGuideDetailForViewer(id);
  const supabase = await createSupabaseServerClient();
  const fromDb =
    supabase != null ? await fetchLearningGuideByIdForViewer(supabase, id) : null;
  const row = fromDb ?? builtin;
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    bodyHtml: sanitizeLessonBodyHtml(row.body_html),
  });
}
