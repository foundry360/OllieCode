"use client";

import { useEffect, useId, useState } from "react";

type SaveMissionNameModalProps = {
  open: boolean;
  missionTitle: string;
  defaultName: string;
  onCancel: () => void;
  onConfirm: (displayName: string) => void | Promise<void>;
  saving?: boolean;
  /** `rename` — shorter copy and “Rename” primary action. */
  variant?: "save" | "rename";
  /**
   * Signed-in save from a catalog starter — copy cannot replace the template;
   * prompt for the learner’s own adventure name.
   */
  forkFromCatalogTemplate?: boolean;
};

export function SaveMissionNameModal({
  open,
  missionTitle,
  defaultName,
  onCancel,
  onConfirm,
  saving = false,
  variant = "save",
  forkFromCatalogTemplate = false,
}: SaveMissionNameModalProps) {
  const titleId = useId();
  const inputId = useId();
  const [value, setValue] = useState(defaultName);

  useEffect(() => {
    if (open) setValue(defaultName);
  }, [open, defaultName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, saving]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function submit() {
    const t = value.trim();
    if (!t || saving) return;
    await onConfirm(t);
  }

  return (
    <div
      className="fixed inset-0 z-[200030] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={saving ? undefined : onCancel}
        disabled={saving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-2xl"
      >
        <h2
          id={titleId}
          className="font-display text-lg font-bold text-[#111827]"
        >
          {variant === "rename"
            ? "Rename your adventure"
            : forkFromCatalogTemplate
              ? "Name your adventure"
              : "Name your adventure save"}
        </h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          {forkFromCatalogTemplate ? (
            <>
              The <span className="font-semibold text-[#374151]">{missionTitle}</span>{" "}
              starter cannot be saved over. Pick a name for{" "}
              <span className="font-semibold text-[#374151]">your</span> copy — then you
              can keep editing and saving it.
            </>
          ) : (
            <>
              Adventure:{" "}
              <span className="font-semibold text-[#374151]">{missionTitle}</span>
            </>
          )}
        </p>
        <label htmlFor={inputId} className="mt-4 block text-sm font-semibold text-[#374151]">
          {variant === "rename"
            ? "Adventure name"
            : forkFromCatalogTemplate
              ? "Your adventure name"
              : "Save as"}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          disabled={saving}
          maxLength={80}
          className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-base text-[#111827] shadow-sm focus:border-[#84c126] focus:outline-none focus:ring-2 focus:ring-[#84c126]/30 disabled:opacity-60"
          autoComplete="off"
          autoFocus
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !value.trim()}
            onClick={() => void submit()}
            className="rounded-xl bg-[#84c126] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6fa020] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {saving
              ? variant === "rename"
                ? "Renaming…"
                : "Saving…"
              : variant === "rename"
                ? "Rename"
                : forkFromCatalogTemplate
                  ? "Save my copy"
                  : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
