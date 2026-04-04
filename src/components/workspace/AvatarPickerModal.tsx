"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { OLLIE_AVATARS } from "@/lib/profiles/avatarAssets";
import type { OllieAvatarId } from "@/lib/profiles/avatarAssets";

type AvatarPickerModalProps = {
  open: boolean;
  onClose: () => void;
  selectedId: OllieAvatarId | null;
  onSelect: (id: OllieAvatarId) => void;
};

export function AvatarPickerModal({
  open,
  onClose,
  selectedId,
  onSelect,
}: AvatarPickerModalProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close avatar picker"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex min-h-0 max-h-[min(720px,90vh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
          <h2 id={titleId} className="text-base font-bold text-[#111827] sm:text-lg">
            Choose your avatar
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl leading-none text-[#6b7280] hover:bg-[#f3f4f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="grid grid-cols-6 items-start gap-2 overflow-y-auto p-4 sm:gap-3 sm:p-5">
          {OLLIE_AVATARS.map((avatar) => {
            const selected = selectedId === avatar.id;
            return (
              <button
                key={avatar.id}
                type="button"
                aria-label={avatar.label}
                title={avatar.label}
                onClick={() => {
                  onSelect(avatar.id);
                  onClose();
                }}
                className={[
                  "block min-w-0 overflow-hidden rounded-xl border bg-white p-0 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#84c126] ring-2 ring-[#84c126]/30"
                    : "border-[#d1d5db] hover:border-[#9ca3af]",
                ].join(" ")}
              >
                <div className="relative w-full bg-white">
                  <div className="block w-full pb-[100%]" aria-hidden />
                  <div className="absolute inset-1.5 flex items-center justify-center sm:inset-2">
                    <img
                      src={avatar.src}
                      alt=""
                      width={512}
                      height={512}
                      className="h-auto max-h-full w-auto max-w-full object-contain select-none"
                      draggable={false}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
