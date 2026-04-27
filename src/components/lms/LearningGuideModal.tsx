"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; title: string; bodyHtml: string }
  | { status: "error"; message: string };

export function LearningGuideModal({
  guideId,
  onClose,
}: {
  guideId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });

  const requestClose = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    if (!guideId) {
      queueMicrotask(() => {
        setLoad({ status: "idle" });
      });
      dialogRef.current?.close();
      return;
    }

    const dlg = dialogRef.current;
    if (dlg && !dlg.open) {
      dlg.showModal();
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoad({ status: "loading" });
    });

    fetch(`/api/learn/guides/${encodeURIComponent(guideId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const msg =
            res.status === 404 ? "This guide is not available." : "Could not load guide.";
          throw new Error(msg);
        }
        return res.json() as Promise<{ title?: string; bodyHtml?: string }>;
      })
      .then((json) => {
        if (cancelled) return;
        setLoad({
          status: "ok",
          title: json.title ?? "Guide",
          bodyHtml: json.bodyHtml ?? "",
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoad({
          status: "error",
          message: e instanceof Error ? e.message : "Could not load guide.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [guideId]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[100] m-auto max-h-[min(90dvh,800px)] w-[min(95vw,840px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 text-slate-900 shadow-xl ring-1 ring-slate-900/5 backdrop:bg-slate-900/45"
      onClose={() => {
        onClose();
      }}
    >
      <div className="flex max-h-[min(90dvh,800px)] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d6e8a8] bg-[#edfcce] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f6212]/60">
              Learning guide
            </p>
            <h2 className="mt-1 font-display text-xl font-bold leading-tight tracking-tight text-[#1a2e05] sm:text-2xl">
              {load.status === "ok" ? load.title : load.status === "loading" ? "Loading…" : "Guide"}
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="shrink-0 rounded-xl p-2.5 text-[#3f6212]/65 transition hover:bg-white/70 hover:text-[#1a2e05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2 focus-visible:ring-offset-[#edfcce]"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-white px-5 py-5 sm:px-6 sm:py-6">
          {load.status === "loading" ? (
            <p className="text-[15px] leading-relaxed text-slate-600">Loading guide…</p>
          ) : null}
          {load.status === "error" ? (
            <p className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-[15px] leading-relaxed text-red-800">
              {load.message}
            </p>
          ) : null}
          {load.status === "ok" ? (
            <div
              className={
                "guide-modal-body prose prose-slate max-w-none text-slate-800 " +
                "prose-base leading-[1.6] " +
                "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 " +
                "prose-h2:mt-7 prose-h2:mb-2 prose-h2:border-0 prose-h2:pb-0 prose-h2:text-[1.05rem] prose-h2:first-of-type:mt-0 " +
                "[&_p+h2]:mt-6 [&_p:first-of-type+h2+ol]:mb-5 " +
                "prose-p:mb-3 prose-p:mt-0 prose-p:text-[15px] " +
                "[&_a]:font-medium [&_a]:text-[#3f6212] [&_a]:underline-offset-2 [&_a]:no-underline hover:[&_a]:text-[#84c126] hover:[&_a]:underline " +
                "prose-strong:font-semibold prose-strong:text-slate-900 " +
                "prose-ol:my-2 prose-ol:pl-5 prose-ol:text-[15px] prose-ol:leading-[1.55] " +
                "prose-ul:my-2 prose-ul:text-[15px] " +
                "prose-li:my-0.5 prose-li:pl-0.5 prose-li:marker:font-medium prose-li:marker:text-slate-500"
              }
              dangerouslySetInnerHTML={{ __html: load.bodyHtml }}
            />
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
