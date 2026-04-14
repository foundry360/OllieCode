"use client";

import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LessonModule } from "@/lib/lms/lessonsCatalog";

type Props = {
  modules: LessonModule[];
  index: number;
  onIndexChange: (index: number) => void;
};

/**
 * One Learning Hub module per step — title + detail from the lesson plan.
 */
export function ModuleLessonStepper({ modules, index, onIndexChange }: Props) {
  const last = modules.length - 1;
  const current = modules[index];

  const goNext = useCallback(() => {
    onIndexChange(Math.min(index + 1, last));
  }, [index, last, onIndexChange]);

  const goBack = useCallback(() => {
    onIndexChange(Math.max(index - 1, 0));
  }, [index, onIndexChange]);

  if (!current || modules.length === 0) return null;

  return (
    <div className="space-y-5">
      <section aria-labelledby="module-step-title">
        <h3
          id="module-step-title"
          className="font-display text-base font-bold leading-snug text-[#111827]"
        >
          {current.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">
          {current.detail}
        </p>
      </section>

      <div className="border-t border-[#e5e7eb] pt-5">
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            aria-label="Previous module"
            className="inline-flex size-10 items-center justify-center rounded-xl border-2 border-[#e5e7eb] bg-white text-[#4b5563] shadow-sm transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= last}
            aria-label="Next module"
            className={
              index >= last
                ? "inline-flex size-10 cursor-not-allowed items-center justify-center rounded-xl border-2 border-[#e5e7eb] bg-white text-[#9ca3af] shadow-sm"
                : "inline-flex size-10 items-center justify-center rounded-xl border-2 border-[#65a30d] bg-gradient-to-b from-[#a3e635] to-[#84cc16] text-[#1a2e05] shadow-md transition hover:from-[#bef264] hover:to-[#a3e635]"
            }
          >
            <ChevronRight className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
