"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const triggerClass =
  "flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-3 text-left text-sm font-medium text-slate-800 shadow-sm outline-none ring-1 ring-slate-900/[0.04] transition hover:border-[#84c126]/50 hover:bg-[#f8fafc] focus-visible:border-[#84c126] focus-visible:ring-2 focus-visible:ring-[#84c126]/25 disabled:cursor-not-allowed disabled:opacity-50";

const listClass =
  "absolute left-0 right-0 top-full z-[200] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-slate-900/[0.08]";

const optionBase =
  "flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium transition";

export type LearningHubSelectOption = { value: string; label: string };

type LearningHubSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: LearningHubSelectOption[];
  disabled?: boolean;
  /** When the trigger is not wrapped in a `<label>`, set this for screen readers. */
  "aria-label"?: string;
};

export function LearningHubSelect({
  id: idProp,
  value,
  onChange,
  options,
  disabled = false,
  "aria-label": ariaLabel,
}: LearningHubSelectProps) {
  const genId = useId();
  const id = idProp ?? genId;
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? options[0]?.label ?? "";
  }, [options, value]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        id={id}
        type="button"
        className={triggerClass}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#84c126] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>
      {open ? (
        <ul id={listId} role="listbox" className={listClass}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={`${opt.value}::${opt.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${optionBase} ${
                    isSelected
                      ? "bg-[#ecfccb] text-[#365314]"
                      : "text-slate-800 hover:bg-[#f8fafc] hover:text-[#3f6212]"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    close();
                  }}
                >
                  <span
                    className="flex size-4 shrink-0 items-center justify-center"
                    aria-hidden
                  >
                    {isSelected ? (
                      <Check className="size-4 text-[#6b9e1f]" strokeWidth={2.5} />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
