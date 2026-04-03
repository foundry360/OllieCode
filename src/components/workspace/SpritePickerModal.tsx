"use client";

import { useEffect, useId, useRef } from "react";
import { OLLIE_SPRITE_COSTUMES } from "@/lib/canvas/stageAssets";
import type { OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import { SpritePreview } from "@/components/workspace/SpritePreview";

type SpritePickerModalProps = {
  open: boolean;
  onClose: () => void;
  /** When null (e.g. adding a new sprite), no option is shown as the current selection. */
  selectedId: OllieSpriteCostumeId | null;
  onSelect: (id: OllieSpriteCostumeId) => void;
};

export function SpritePickerModal({
  open,
  onClose,
  selectedId,
  onSelect,
}: SpritePickerModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close sprite picker"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(560px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl sm:max-w-lg"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
          <h2 id={titleId} className="text-base font-bold text-[#111827] sm:text-lg">
            Choose a sprite
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
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:gap-4">
          {OLLIE_SPRITE_COSTUMES.map((costume) => {
            const selected =
              selectedId != null && costume.id === selectedId;
            return (
              <button
                key={costume.id}
                type="button"
                onClick={() => {
                  onSelect(costume.id);
                  onClose();
                }}
                className={[
                  "flex flex-col overflow-hidden rounded-xl border-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#84c126] bg-[#f7fee7] shadow-sm"
                    : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1] hover:shadow-sm",
                ].join(" ")}
              >
                <div className="aspect-square w-full overflow-hidden bg-[#f1f5f9]">
                  <SpritePreview costume={costume} />
                </div>
                <span className="px-2 py-2 text-xs font-semibold text-[#111827] sm:text-sm">
                  {costume.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
