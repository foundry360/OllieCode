import { notFound } from "next/navigation";
import { LessonEditorForm } from "@/app/admin/lessons/[lessonId]/edit/lesson-editor-form";
import { getLessonPayloadForAdminEdit } from "@/lib/lms/publishedLessons";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export default async function AdminEditLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await getLessonPayloadForAdminEdit(lessonId);
  if (!lesson) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  let initialPublished = false;
  if (supabase) {
    const { data } = await supabase
      .from("lms_lessons")
      .select("published")
      .eq("id", lessonId)
      .maybeSingle();
    initialPublished = Boolean(data?.published);
  }

  return (
    <LessonEditorForm
      initialLesson={lesson}
      initialPublished={initialPublished}
    />
  );
}
