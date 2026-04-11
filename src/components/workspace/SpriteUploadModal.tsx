"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImageUp } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadPaintedCostumePng } from "@/lib/supabase/costumePaintStorage";

const MAX_BYTES = 5 * 1024 * 1024;
const NAME_MAX = 48;

export type SpriteUploadModalProps = {
  open: boolean;
  onClose: () => void;
  /** Add a new sprite vs replace the selected sprite’s image. */
  mode: "new" | "replace";
  onSuccess: (payload: {
    publicUrl: string;
    displayName: string;
    storagePath: string;
  }) => void;
};

export function SpriteUploadModal({
  open,
  onClose,
  mode,
  onSuccess,
}: SpriteUploadModalProps) {
  const titleId = useId();
  const nameId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setDisplayName("");
    setError(null);
    setDragOver(false);
    setUploading(false);
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyPngFile = useCallback((f: File) => {
    setError(null);
    if (f.type !== "image/png") {
      setError("Please use a PNG file (.png).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("PNG must be 5 MB or smaller.");
      return;
    }
    setFile(f);
    setDisplayName((prev) => {
      if (prev.trim().length > 0) return prev;
      const base = f.name.replace(/\.[^.]+$/i, "").trim();
      return base.slice(0, NAME_MAX);
    });
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (f) applyPngFile(f);
    },
    [applyPngFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) applyPngFile(f);
    },
    [applyPngFile],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, uploading]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function submit() {
    if (!file || uploading) return;
    const name = displayName.trim();
    if (!name) {
      setError("Enter a name for this sprite.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const sb = getSupabaseBrowserClient();
      if (!sb) {
        setError("Sign in to upload an image.");
        return;
      }
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setError("Sign in to upload an image.");
        return;
      }
      const { publicUrl, storagePath, error: upErr } =
        await uploadPaintedCostumePng(sb, user.id, file);
      if (upErr || !publicUrl || !storagePath) {
        setError(upErr?.message ?? "Upload failed.");
        return;
      }
      onSuccess({
        publicUrl,
        displayName: name.slice(0, NAME_MAX),
        storagePath,
      });
      onClose();
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  const modeHint =
    mode === "new"
      ? "Adds a new sprite with your image."
      : "Replaces the selected sprite’s look.";

  return createPortal(
    <div
      className="fixed inset-0 z-[200025] flex min-h-0 items-center justify-center p-4 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={uploading ? undefined : onClose}
        disabled={uploading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-lg font-bold text-[#111827]"
            >
              Upload sprite image
            </h2>
            <p className="mt-0.5 text-xs text-[#64748b]">{modeHint}</p>
          </div>
          <button
            type="button"
            onClick={uploading ? undefined : onClose}
            disabled={uploading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-[#6b7280] hover:bg-[#f1f5f9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
              dragOver
                ? "border-[#84c126] bg-[#f7fee7]"
                : "border-[#cbd5e1] bg-[#f8fafc] hover:border-[#94a3b8]",
            ].join(" ")}
          >
            <ImageUp className="size-10 text-[#94a3b8]" strokeWidth={1.5} aria-hidden />
            <span className="text-sm font-semibold text-[#374151]">
              Drag and drop a PNG here
            </span>
            <span className="text-xs text-[#64748b]">or click to choose a file</span>
            <span className="text-[11px] text-[#9ca3af]">PNG only · max 5 MB</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png"
              className="sr-only"
              aria-hidden
              tabIndex={-1}
              onChange={onInputChange}
            />
          </div>

          {previewUrl ? (
            <div className="flex justify-center rounded-lg border border-[#e5e7eb] bg-[#f1f5f9] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
              <img
                src={previewUrl}
                alt=""
                className="max-h-40 max-w-full object-contain"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor={nameId}
              className="block text-xs font-semibold text-[#374151]"
            >
              Sprite name
            </label>
            <input
              id={nameId}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, NAME_MAX))}
              placeholder="Name this sprite"
              disabled={uploading}
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm font-semibold text-[#111827] shadow-sm focus:border-[#84c126] focus:outline-none focus:ring-2 focus:ring-[#d9f99d]/60 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={uploading}
              onClick={onClose}
              className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#4b5563] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading || !file || !displayName.trim()}
              onClick={() => void submit()}
              className="rounded-xl border-2 border-[#65a30d] bg-gradient-to-b from-[#a3e635] to-[#84cc16] px-5 py-2.5 text-sm font-bold text-[#1a2e05] shadow-md transition hover:from-[#bef264] hover:to-[#a3e635] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
            >
              {uploading ? "Uploading…" : "Use this image"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
