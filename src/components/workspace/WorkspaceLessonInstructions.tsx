"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import {
  lessonDetailHref,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";

const bodyProseClass =
  "workspace-lesson-body max-w-none text-sm leading-relaxed text-[#374151] [&_a]:font-semibold [&_a]:text-[#84c126] [&_a]:no-underline hover:[&_a]:text-[#6b9e1f] [&_h2]:mt-0 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5";

type Props = {
  lesson: LessonCatalogEntry | undefined;
};

export function WorkspaceLessonInstructions({ lesson }: Props) {
  return (
    <section
      aria-label={lesson ? `Lesson: ${lesson.title}` : "Lesson"}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2">
        <BookOpen
          className="size-4 shrink-0 text-[#365314]"
          strokeWidth={2}
          aria-hidden
        />
        <h2 className="min-w-0 text-sm font-semibold text-[#365314]">
          {lesson ? lesson.title : "Lesson"}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
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
            to see steps here while you build.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[#374151]">
              {lesson.summary}
            </p>

            {!isTrivialLessonHtml(lesson.bodyHtml) ? (
              <div
                className={bodyProseClass}
                dangerouslySetInnerHTML={{
                  __html: sanitizeLessonBodyHtml(lesson.bodyHtml),
                }}
              />
            ) : null}

            {lesson.modules.length > 0 ? (
              <div>
                <h3 className="font-display text-xs font-bold uppercase tracking-wide text-[#6b7280]">
                  Steps
                </h3>
                <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm text-[#374151] marker:font-semibold marker:text-[#84c126]">
                  {lesson.modules.map((mod) => (
                    <li key={mod.id} className="pl-1">
                      <span className="font-semibold text-[#111827]">
                        {mod.title}
                      </span>
                      <p className="mt-1 text-[#4b5563]">{mod.detail}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <p className="border-t border-dashed border-[#e5e7eb] pt-3 text-xs text-[#6b7280]">
              <Link
                href={lessonDetailHref(lesson.id)}
                className="font-semibold text-[#84c126] underline decoration-[#84c126]/40 underline-offset-2 hover:text-[#6b9e1f]"
              >
                Full lesson page
              </Link>
              {" — "}
              overview, points, and extras.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
