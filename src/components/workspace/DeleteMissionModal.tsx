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
        className="relative z-10 w-full max-w-md rounded-3xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50 to-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-center text-4xl" aria-hidden>
          🧹
        </p>
        <h2
          id={titleId}
          className="font-display mt-2 text-center text-xl font-bold text-[#1f2937] sm:text-2xl"
        >
          Sweep this adventure away?
        </h2>
        <p className="mt-4 text-center text-sm leading-relaxed text-[#4b5563] sm:text-base">
          If you tap <strong className="text-[#374151]">Delete</strong>, we’ll
          pack up{" "}
          <span className="font-semibold text-[#365314]">
            &ldquo;{missionLabel}&rdquo;
          </span>{" "}
          and say goodbye for good — it won’t be in your adventures list anymore,
          and we can’t magic it back. Your coding space will get a shiny fresh
          start!
        </p>
        <p className="mt-3 text-center text-sm font-medium text-[#92400e]">
          Only say yes if you’re sure. No worries if you’re not — that’s what
          “Keep it” is for.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <button
            type="button"
            autoFocus
            disabled={deleting}
            onClick={onClose}
            className="rounded-2xl border-2 border-[#d9f99d] bg-[#ecfccb] px-5 py-3 text-sm font-bold text-[#3f6212] shadow-sm transition hover:bg-[#d9f99d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void onConfirm()}
            className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
