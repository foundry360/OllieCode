"use client";

import { useEffect, useId, useRef } from "react";
import { OLLIE_SCENES } from "@/lib/canvas/stageAssets";
import type { OllieSceneId } from "@/lib/canvas/stageAssets";
import { ScenePreview } from "@/components/workspace/ScenePreview";

type ScenePickerModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Which scene shows the green border (e.g. top layer). Set `false` when adding another layer. */
  selectedId?: OllieSceneId | false;
  onSelect: (id: OllieSceneId) => void;
};

export function ScenePickerModal({
  open,
  onClose,
  title = "Choose a Scene",
  selectedId,
  onSelect,
}: ScenePickerModalProps) {
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
      className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center p-4 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close scene picker"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex min-h-0 h-[82vh] max-h-[82dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[calc(100vw-2.5rem)] sm:max-w-[calc(100vw-2.5rem)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-t-2xl border-b border-[#6b9e1f] bg-[#84c126] px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-base font-bold text-white sm:text-lg">
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl leading-none text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-2.5 md:gap-3 [grid-auto-rows:minmax(0,auto)]">
          {OLLIE_SCENES.map((scene) => {
            const selected =
              selectedId !== false && scene.id === selectedId;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  onSelect(scene.id);
                  onClose();
                }}
                className={[
                  "flex min-w-0 flex-col overflow-hidden rounded-lg border-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#84c126] bg-[#f7fee7] shadow-sm"
                    : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1] hover:shadow-sm",
                ].join(" ")}
              >
                <div className="aspect-video w-full min-w-0 overflow-hidden rounded-md bg-[#f1f5f9]">
                  <ScenePreview scene={scene} />
                </div>
                <span className="truncate px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-[#111827] sm:text-[11px]">
                  {scene.label}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
