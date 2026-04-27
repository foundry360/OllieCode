"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import {
  uploadLessonImageAction,
  type UploadLessonImageResult,
} from "@/app/admin/lessons/actions";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Taller drop target for wide card art vs square thumbnail */
  variant: "card" | "thumbnail";
  disabled?: boolean;
  /** Defaults to lesson card upload; pass e.g. `uploadLearningGuideCardImageAction` for guides. */
  uploadAction?: (formData: FormData) => Promise<UploadLessonImageResult>;
};

export function LessonImageDropzone({
  label,
  value,
  onChange,
  variant,
  disabled = false,
  uploadAction = uploadLessonImageAction,
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  const minH = variant === "card" ? "min-h-[132px]" : "min-h-[112px]";

  const runUpload = useCallback(
    async (file: File) => {
      setLocalError("");
      const fd = new FormData();
      fd.set("file", file);
      setUploading(true);
      try {
        const r = await uploadAction(fd);
        if (!r.ok) setLocalError(r.message);
        else onChange(r.url);
      } finally {
        setUploading(false);
      }
    },
    [onChange, uploadAction],
  );

  const onPickFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) void runUpload(file);
    },
    [runUpload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;
      onPickFiles(e.dataTransfer.files);
    },
    [disabled, uploading, onPickFiles],
  );

  const borderClass = dragOver
    ? "border-[#84c126] bg-[#ecfccb]/50 ring-2 ring-[#84c126]/30"
    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50";

  return (
    <div>
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading}
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!value ? (
        <label
          htmlFor={inputId}
          className={`mt-1.5 flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-dashed bg-slate-50/80 transition ${borderClass} ${minH} ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={onDrop}
        >
          <span className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-2 px-4 py-5 text-center">
            {uploading ? (
              <span className="text-sm font-medium text-slate-600">Uploading…</span>
            ) : (
              <>
                <span className="flex items-center gap-2 text-slate-500" aria-hidden>
                  <Upload className="size-5 shrink-0" strokeWidth={2} />
                  <ImageIcon className="size-5 shrink-0 opacity-70" strokeWidth={1.5} />
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Drag and drop an image here
                </span>
                <span className="text-xs text-slate-500">
                  or click to browse — JPEG, PNG, WebP, or GIF · max 5 MB
                </span>
              </>
            )}
          </span>
        </label>
      ) : (
        <div
          className={`mt-1.5 overflow-hidden rounded-xl border-2 border-dashed p-3 transition ${minH} ${
            dragOver
              ? "border-[#84c126] bg-[#ecfccb]/50 ring-2 ring-[#84c126]/30"
              : "border-slate-200 bg-slate-50/50"
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (disabled || uploading) return;
            onPickFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <img
              src={value}
              alt=""
              className={
                variant === "card"
                  ? "mx-auto max-h-48 w-full max-w-md object-contain"
                  : "mx-auto max-h-32 w-full max-w-xs object-contain"
              }
            />
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                disabled={disabled || uploading}
                onClick={() => fileRef.current?.click()}
              >
                Replace
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={disabled || uploading}
                onClick={() => onChange("")}
              >
                Remove
              </button>
            </div>
          </div>
          {uploading ? (
            <p className="mt-2 text-xs font-medium text-slate-600">Uploading…</p>
          ) : null}
        </div>
      )}

      {localError ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
