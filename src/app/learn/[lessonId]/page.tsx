import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonDetailPage } from "@/components/lms/LessonDetailPage";
import { getLessonByIdMerged } from "@/lib/lms/publishedLessons";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLessonByIdMerged(lessonId);
  if (!lesson) {
    return { title: "Lesson | Ollie Code" };
  }
  return {
    title: `${lesson.title} | Learning Hub`,
    description: lesson.summary,
  };
}

export default async function LessonDetailRoute({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await getLessonByIdMerged(lessonId);
  if (!lesson) {
    notFound();
  }
  return <LessonDetailPage lesson={lesson} />;
}
