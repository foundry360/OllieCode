"use client";

import { useEffect, useId } from "react";

type MissionCompleteModalProps = {
  open: boolean;
  missionTitle: string;
  onSave: () => void | Promise<void>;
  onDismiss: () => void;
  saving?: boolean;
};

export function MissionCompleteModal({
  open,
  missionTitle,
  onSave,
  onDismiss,
  saving = false,
}: MissionCompleteModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss, saving]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200010] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={saving ? undefined : onDismiss}
        disabled={saving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-2xl sm:max-w-md"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[#84c126]">
          Adventure complete
        </p>
        <h2
          id={titleId}
          className="mt-1 text-base font-bold text-[#111827] sm:text-lg"
        >
          {missionTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">
          Save your project so you can keep it when you come back.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onDismiss}
            className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] disabled:opacity-60"
          >
            Keep coding
          </button>
          <button
            type="button"
            autoFocus
            disabled={saving}
            onClick={() => void onSave()}
            className="rounded-xl bg-[#84c126] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6fa020] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save my work"}
          </button>
        </div>
      </div>
    </div>
  );
}
