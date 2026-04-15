import { NextResponse } from "next/server";
import { getLessonByIdMerged } from "@/lib/lms/publishedLessons";

/**
 * Merged lesson (static catalog + published `lms_lessons` overrides) for the workspace panel.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await context.params;
  const decoded = decodeURIComponent(lessonId);
  const lesson = await getLessonByIdMerged(decoded);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  return NextResponse.json(lesson);
}
