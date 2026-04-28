"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type DeleteMissionModalProps = {
  open: boolean;
  missionLabel: string;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteMissionModal({
  open,
  missionLabel,
  deleting = false,
  onClose,
  onConfirm,
}: DeleteMissionModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, deleting]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200040] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={deleting ? undefined : onClose}
        disabled={deleting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-2xl sm:max-w-md"
      >
        <h2
          id={titleId}
          className="font-display text-lg font-bold text-[#111827]"
        >
          Sweep this adventure away?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563] sm:text-base">
          If you tap{" "}
          <strong className="font-semibold text-[#374151]">Delete</strong>, we’ll
          pack up{" "}
          <span className="font-semibold text-[#365314]">
            &ldquo;{missionLabel}&rdquo;
          </span>{" "}
          and say goodbye for good. It won’t be in your adventures list anymore,
          and we can’t magic it back. Your coding space will get a shiny fresh
          start!
        </p>
        <p className="mt-3 text-sm font-medium leading-relaxed text-[#b45309]">
          Only say yes if you’re sure. No worries if you’re not. That’s what
          “Keep it” is for.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2">
          <button
            type="button"
            autoFocus
            disabled={deleting}
            onClick={onClose}
            className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void onConfirm()}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
