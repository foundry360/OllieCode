import Link from "next/link";

const STEPS = [
  { step: 1 as const, label: "Basics", hint: "Details & media" },
  { step: 2 as const, label: "Content", hint: "Modules in editor" },
  { step: 3 as const, label: "Publish", hint: "Go live" },
];

export type LessonStepLinks = {
  basics?: string;
  content?: string;
  publish?: string;
};

type Props = {
  currentStep: 1 | 2 | 3;
  stepLinks?: LessonStepLinks;
};

function hrefForStep(
  step: 1 | 2 | 3,
  stepLinks: LessonStepLinks | undefined,
): string | undefined {
  if (!stepLinks) return undefined;
  if (step === 1) return stepLinks.basics;
  if (step === 2) return stepLinks.content;
  return stepLinks.publish;
}

const circleBase =
  "z-[1] mx-1 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:mx-2 sm:size-10";

export function LessonStatusStepper({ currentStep, stepLinks }: Props) {
  return (
    <nav aria-label="Lesson setup progress" className="w-full">
      <ol className="flex items-start justify-between gap-0">
        {STEPS.map((s, i) => {
          const done = currentStep > s.step;
          const active = currentStep === s.step;
          const upcoming = currentStep < s.step;
          const href = hrefForStep(s.step, stepLinks);

          const circleClass = `${circleBase} ${
            done
              ? "bg-[#84c126] text-white"
              : active
                ? "bg-[#ecfccb] text-[#365314] ring-2 ring-[#84c126]"
                : "bg-slate-100 text-slate-400"
          }`;

          const labelClass = `mt-2 max-w-[100px] text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:max-w-none sm:text-xs ${
            active ? "text-[#365314]" : upcoming ? "text-slate-400" : "text-slate-600"
          }`;

          const row = (
            <div className="flex w-full items-center">
              <div
                className={`h-0.5 flex-1 rounded-full ${
                  i === 0 ? "opacity-0" : currentStep > STEPS[i - 1]!.step
                    ? "bg-[#84c126]"
                    : "bg-slate-200"
                }`}
                aria-hidden
              />
              <span
                className={circleClass}
                aria-current={
                  href ? undefined : active ? "step" : undefined
                }
              >
                {done ? "✓" : s.step}
              </span>
              <div
                className={`h-0.5 flex-1 rounded-full ${
                  i === STEPS.length - 1
                    ? "opacity-0"
                    : currentStep > s.step
                      ? "bg-[#84c126]"
                      : "bg-slate-200"
                }`}
                aria-hidden
              />
            </div>
          );

          const labels = (
            <>
              <p className={labelClass}>{s.label}</p>
              <p className="mt-0.5 hidden text-center text-[10px] text-slate-500 sm:block">
                {s.hint}
              </p>
            </>
          );

          return (
            <li
              key={s.step}
              className="relative flex min-w-0 flex-1 flex-col items-center last:mr-0"
            >
              {href ? (
                <Link
                  href={href}
                  className="flex w-full flex-col items-center rounded-lg text-inherit no-underline outline-offset-2 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#84c126]"
                  aria-current={active ? "step" : undefined}
                >
                  {row}
                  {labels}
                </Link>
              ) : (
                <div className="flex w-full flex-col items-center">
                  {row}
                  {labels}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
