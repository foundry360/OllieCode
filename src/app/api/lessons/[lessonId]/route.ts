import { NextResponse } from "next/server";
import { getLessonByIdMerged } from "@/lib/lms/publishedLessons";

/** Published lesson from `lms_lessons` for the workspace panel. */
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
