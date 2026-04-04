"use client";

import { Fragment, useCallback, useRef } from "react";

const GROUPS: { label: string; start: number; len: number }[] = [
  { label: "Month", start: 0, len: 2 },
  { label: "Day", start: 2, len: 2 },
  { label: "Year", start: 4, len: 4 },
];

export type BirthDateDigitsProps = {
  digits: string[];
  onDigitsChange: (next: string[]) => void;
  disabled?: boolean;
};

export function BirthDateDigits({
  digits,
  onDigitsChange,
  disabled,
}: BirthDateDigitsProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = useCallback(
    (index: number, raw: string) => {
      const digit = raw.replace(/\D/g, "").slice(-1);
      const next = [...digits];
      next[index] = digit;
      onDigitsChange(next);
      if (digit && index < 7) {
        inputsRef.current[index + 1]?.focus();
        inputsRef.current[index + 1]?.select();
      }
    },
    [digits, onDigitsChange],
  );

  const onKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
      if (text.length !== 8) return;
      e.preventDefault();
      onDigitsChange(text.split(""));
      queueMicrotask(() => {
        inputsRef.current[7]?.focus();
        inputsRef.current[7]?.select();
      });
    },
    [onDigitsChange],
  );

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-[#374151]">
        When were you born?
      </legend>
      <div
        className="mt-3 flex w-full min-w-0 items-stretch gap-2"
        onPaste={onPaste}
      >
        {GROUPS.map((g, gi) => (
          <Fragment key={g.label}>
            {Array.from({ length: g.len }, (_, j) => {
              const i = g.start + j;
              return (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={disabled}
                  maxLength={1}
                  value={digits[i] ?? ""}
                  aria-label={`${g.label}, digit ${j + 1} of ${g.len}`}
                  className="min-h-12 min-w-0 flex-1 basis-0 rounded-xl border border-[#e5e7eb] bg-white py-3 text-center text-2xl font-semibold tabular-nums text-[#111827] outline-none ring-[#84c126] focus:border-[#84c126] focus:ring-2 disabled:opacity-50"
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                />
              );
            })}
            {gi < GROUPS.length - 1 ? (
              <span
                className="flex shrink-0 select-none items-center justify-center self-stretch px-0.5 text-xl font-light text-[#d1d5db]"
                aria-hidden
              >
                /
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </fieldset>
  );
}
