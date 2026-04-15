"use client";

import { useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatModuleDurationMinutes,
  formatPointsLabel,
  formatStepCountLabel,
  type LessonModule,
} from "@/lib/lms/lessonsCatalog";
import { embellishLessonColorWords } from "@/lib/lms/embellishLessonColorWords";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";
import {
  BLOCK_COLORS,
  type VisualLessonStep,
} from "@/lib/lms/visualLessonTypes";

/** Rich text from admin / TipTap — same sanitization as hub lesson modules. */
const moduleDetailProseClass =
  "module-lesson-detail max-w-none text-sm leading-relaxed text-[#4b5563] [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_a]:font-semibold [&_a]:text-[#84c126] [&_a]:no-underline hover:[&_a]:text-[#6b9e1f]";

type Props = {
  modules: LessonModule[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Optional Scratch-style cards from the lesson payload (merged from DB when present). */
  visualSteps?: VisualLessonStep[];
};

function VisualLessonBlockPreview({ step }: { step: VisualLessonStep }) {
  const colors = BLOCK_COLORS[step.category];
  return (
    <div
      className="mt-4 rounded-xl border-2 px-3 py-3 shadow-sm"
      style={{
        borderColor: colors.border,
        backgroundColor: `${colors.bg}26`,
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: colors.border }}
      >
        {step.categoryLabel}
      </p>
      <p className="mt-1 font-display text-sm font-bold leading-snug text-[#111827]">
        {step.instruction}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-[#4b5563]">
        {step.description}
      </p>
      {(step.blockLabel ||
        step.blockPrefix ||
        step.blockSuffix ||
        (step.inputs?.length ?? 0) > 0) && (
        <div
          className="mt-3 inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#1a2e05] shadow-inner"
          style={{
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {step.blockShape === "hat" ? (
            <span className="whitespace-pre-wrap">
              {step.blockLabel ?? step.blockPrefix}
            </span>
          ) : (
            <>
              {step.blockPrefix ? (
                <span className="whitespace-pre-wrap">{step.blockPrefix}</span>
              ) : null}
              {step.inputs?.map((inp, i) => (
                <span
                  key={i}
                  className="inline-flex min-w-[2rem] items-center justify-center rounded border px-1.5 py-0.5 tabular-nums"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                  }}
                >
                  {inp.value}
                </span>
              ))}
              {step.blockSuffix ? (
                <span className="whitespace-pre-wrap">{step.blockSuffix}</span>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One Learning Hub module per step — title + detail from the lesson plan.
 */
export function ModuleLessonStepper({
  modules,
  index,
  onIndexChange,
  visualSteps,
}: Props) {
  const last = modules.length - 1;
  const current = modules[index];

  const visualForStep = useMemo((): VisualLessonStep | undefined => {
    if (!visualSteps?.length) return undefined;
    const byIndex = visualSteps[index];
    if (byIndex) return byIndex;
    return visualSteps.find((s) => s.stepNumber === index + 1);
  }, [visualSteps, index]);

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
          className="font-display text-base font-bold capitalize leading-snug text-[#111827]"
        >
          {current.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#6b7280]">
          <span className="tabular-nums">
            {formatModuleDurationMinutes(current.durationMins)}
          </span>
          {formatStepCountLabel(current.steps) ? (
            <span className="tabular-nums">
              {formatStepCountLabel(current.steps)}
            </span>
          ) : null}
          {current.points > 0 ? (
            <span className="tabular-nums text-[#365314]">
              {formatPointsLabel(current.points)}
            </span>
          ) : null}
        </div>
        {!isTrivialLessonHtml(current.detail) ? (
          <div
            className={`${moduleDetailProseClass} mt-3`}
            dangerouslySetInnerHTML={{
              __html: sanitizeLessonBodyHtml(
                embellishLessonColorWords(current.detail),
              ),
            }}
          />
        ) : null}
        {visualForStep ? (
          <VisualLessonBlockPreview step={visualForStep} />
        ) : null}
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
