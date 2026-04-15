"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { type LessonCatalogEntry } from "@/lib/lms/lessonsCatalog";
import { ModuleLessonStepper } from "@/components/workspace/ModuleLessonStepper";

type Props = {
  lesson: LessonCatalogEntry | undefined;
};

export function WorkspaceLessonInstructions({ lesson }: Props) {
  const [moduleIndex, setModuleIndex] = useState(0);
  const modules = lesson?.modules ?? [];
  const moduleCount = modules.length;
  const showModuleProgress = Boolean(lesson) && moduleCount > 0;

  useEffect(() => {
    setModuleIndex(0);
  }, [lesson?.id]);

  return (
    <section
      aria-label="Lesson"
      className="ollie-lesson-card-host flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen
            className="size-4 shrink-0 text-[#365314]"
            strokeWidth={2}
            aria-hidden
          />
          <h2 className="min-w-0 text-sm font-semibold text-[#365314]">
            Lesson
          </h2>
        </div>
        {showModuleProgress ? (
          <p
            className="shrink-0 text-sm font-bold tabular-nums text-[#365314]"
            aria-live="polite"
          >
            Module {moduleIndex + 1} of {moduleCount}
          </p>
        ) : null}
      </div>

      <div className="ollie-lesson-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
        {!lesson ? (
          <p className="text-sm leading-relaxed text-[#6b7280]">
            Open a lesson from the{" "}
            <Link
              href="/learn"
              className="font-semibold text-[#84c126] underline decoration-[#84c126]/40 underline-offset-2 hover:text-[#6b9e1f]"
            >
              Learning Hub
            </Link>{" "}
            and tap{" "}
            <strong className="font-semibold text-[#374151]">
              Activate lesson
            </strong>{" "}
            to see the lesson plan here while you build.
          </p>
        ) : moduleCount > 0 ? (
          <div className="space-y-5">
            {moduleIndex === 0 ? (
              <p className="text-sm leading-relaxed text-[#374151]">
                {lesson.summary}
              </p>
            ) : null}

            <ModuleLessonStepper
              modules={modules}
              index={moduleIndex}
              onIndexChange={setModuleIndex}
              visualSteps={lesson.visualSteps}
            />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[#374151]">
            {lesson.summary}
          </p>
        )}
      </div>
    </section>
  );
}
