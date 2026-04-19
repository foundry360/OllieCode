"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";
import { type LessonCatalogEntry } from "@/lib/lms/lessonsCatalog";
import { ModuleLessonStepper } from "@/components/workspace/ModuleLessonStepper";

type Props = {
  lesson: LessonCatalogEntry | undefined;
  /**
   * When there is no hub lesson and the card is collapsed, `true` so the workspace shell
   * can shrink the lesson rail and let the stage grow upward.
   */
  onLessonChromeCompact?: (compact: boolean) => void;
};

export function WorkspaceLessonInstructions({
  lesson,
  onLessonChromeCompact,
}: Props) {
  const [moduleIndex, setModuleIndex] = useState(0);
  /** When there is no hub lesson, panel starts collapsed (header only). */
  const [noLessonExpanded, setNoLessonExpanded] = useState(false);
  const modules = lesson?.modules ?? [];
  const moduleCount = modules.length;
  const showModuleProgress = Boolean(lesson) && moduleCount > 0;

  useEffect(() => {
    setModuleIndex(0);
  }, [lesson?.id]);

  useEffect(() => {
    if (lesson) setNoLessonExpanded(false);
  }, [lesson]);

  useLayoutEffect(() => {
    if (!lesson) {
      onLessonChromeCompact?.(!noLessonExpanded);
    } else {
      onLessonChromeCompact?.(false);
    }
  }, [lesson, noLessonExpanded, onLessonChromeCompact]);

  if (!lesson) {
    return (
      <section
        aria-label="Lesson"
        className={[
          "ollie-lesson-card-host flex w-full flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm",
          noLessonExpanded
            ? "min-h-0 flex-1 self-stretch"
            : "max-h-fit shrink-0 self-start",
        ].join(" ")}
      >
        <button
          type="button"
          id="ollie-lesson-no-hub-toggle"
          aria-expanded={noLessonExpanded}
          aria-controls="ollie-lesson-no-hub-panel"
          onClick={() => setNoLessonExpanded((v) => !v)}
          className="flex w-full shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2 text-left transition hover:bg-[#e3f6b8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
        >
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
          <ChevronDown
            className={[
              "size-5 shrink-0 text-[#365314] transition-transform duration-200",
              noLessonExpanded ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden
          />
        </button>

        {noLessonExpanded ? (
          <div
            id="ollie-lesson-no-hub-panel"
            role="region"
            aria-labelledby="ollie-lesson-no-hub-toggle"
            className="ollie-lesson-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4 pt-3"
          >
            <p className="text-sm leading-relaxed text-[#6b7280]">
              Feeling creative? Code your own ideas! Want a treasure map? Open
              the{" "}
              <strong className="font-semibold text-[#374151]">
                Learning Hub
              </strong>
              , pick a lesson, then hit{" "}
              <strong className="font-semibold text-[#374151]">
                Activate Lesson
              </strong>{" "}
              to see the steps here.
            </p>
            <Link
              href="/learn"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#84c126] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
            >
              Learning Hub
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

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
        {moduleCount > 0 ? (
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
