import { NextResponse } from "next/server";
import { hubLessonIdFromWorkspaceLessonQuery } from "@/lib/lms/lessonsCatalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Records one hub lesson workspace open (`?lesson=`) for Popular ordering on `/learn`. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw =
    typeof body === "object" &&
    body !== null &&
    "lessonId" in body &&
    typeof (body as { lessonId: unknown }).lessonId === "string"
      ? (body as { lessonId: string }).lessonId
      : "";
  const lessonId = hubLessonIdFromWorkspaceLessonQuery(raw);
  if (!lessonId) {
    return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { error } = await supabase.rpc("record_lesson_hub_activation", {
    p_lesson_id: lessonId,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
