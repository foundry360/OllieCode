"use client";

/**
 * Segmented control: Draft (hidden from Learning Hub) vs Live (published).
 */
export function LessonPublishToggle({
  published,
  onChange,
  disabled,
}: {
  published: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="relative isolate inline-flex h-10 w-[13.5rem] shrink-0 rounded-full border border-slate-200 bg-slate-100/95 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]"
      role="radiogroup"
      aria-label="Learning Hub status"
    >
      <span
        className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-6px)] rounded-full shadow-md transition-[left,background-color] duration-200 ease-[cubic-bezier(0.34,1.3,0.64,1)] ${
          published
            ? "left-[calc(50%+3px)] bg-[#84c126] ring-1 ring-[#6b9e1f]/60"
            : "left-1 bg-white ring-1 ring-slate-200/70"
        }`}
        aria-hidden
      />
      <button
        type="button"
        role="radio"
        aria-checked={!published}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`relative z-[1] flex min-w-0 flex-1 items-center justify-center rounded-full py-1.5 text-sm font-bold transition-colors ${
          !published
            ? "text-[#365314]"
            : "text-slate-500 hover:text-slate-700 disabled:opacity-50"
        }`}
      >
        Draft
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={published}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`relative z-[1] flex min-w-0 flex-1 items-center justify-center rounded-full py-1.5 text-sm font-bold transition-colors ${
          published
            ? "text-white"
            : "text-slate-500 hover:text-slate-700 disabled:opacity-50"
        }`}
      >
        Live
      </button>
    </div>
  );
}
