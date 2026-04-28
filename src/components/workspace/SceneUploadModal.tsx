"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImageUp } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadUserScenePng } from "@/lib/supabase/costumePaintStorage";

const MAX_BYTES = 5 * 1024 * 1024;
const NAME_MAX = 80;

export type SceneUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: {
    publicUrl: string;
    displayName: string;
    storagePath: string;
    sceneUuid: string;
  }) => void;
};

export function SceneUploadModal({
  open,
  onClose,
  onSuccess,
}: SceneUploadModalProps) {
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
      setError("Enter a name for this scene.");
      return;
    }
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setError("Sign in to upload scenes to the cloud.");
      return;
    }
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      setError("Sign in to upload scenes to the cloud.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const sceneUuid = crypto.randomUUID();
      const { publicUrl, storagePath, error: upErr } = await uploadUserScenePng(
        sb,
        user.id,
        sceneUuid,
        file,
      );
      if (upErr || !publicUrl || !storagePath) {
        setError(upErr?.message ?? "Upload failed.");
        return;
      }
      onSuccess({
        publicUrl,
        displayName: name.slice(0, NAME_MAX),
        storagePath,
        sceneUuid,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200040] flex min-h-0 items-center justify-center p-4 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close upload"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={uploading ? undefined : onClose}
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
          Upload a scene
        </h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          PNG backdrop (max 5 MB). It will appear under{" "}
          <strong className="text-[#374151]">My Scenes</strong> in the scene
          picker.
        </p>

        <div
          className={[
            "mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
            dragOver ? "border-[#84c126] bg-[#f7fee7]" : "border-[#e5e7eb] bg-[#f9fafb]",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp className="mx-auto size-10 text-[#9ca3af]" strokeWidth={1.5} aria-hidden />
          <p className="mt-2 text-sm font-semibold text-[#374151]">
            Drop PNG here or tap to choose
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png"
            className="sr-only"
            onChange={onInputChange}
          />
        </div>

        {previewUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f1f5f9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="mx-auto max-h-40 w-full object-contain"
            />
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <label
          htmlFor={nameId}
          className="mt-4 block text-sm font-semibold text-[#374151]"
        >
          Scene name
        </label>
        <input
          id={nameId}
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={NAME_MAX}
          disabled={uploading}
          className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-base text-[#111827] shadow-sm focus:border-[#84c126] focus:outline-none focus:ring-2 focus:ring-[#84c126]/30 disabled:opacity-60"
          autoComplete="off"
        />

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading || !file || !displayName.trim()}
            onClick={() => void submit()}
            className="rounded-xl bg-[#84c126] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6fa020] disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
