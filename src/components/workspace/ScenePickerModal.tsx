"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import {
  buildUserUploadedBackdropSceneDef,
  OLLIE_SCENES,
  type OllieSceneId,
} from "@/lib/canvas/stageAssets";
import {
  SCENE_CATEGORY_IDS,
  SCENE_CATEGORY_LABELS,
  sceneMatchesCategory,
} from "@/lib/canvas/sceneCategories";
import type { SceneCategoryId } from "@/lib/canvas/sceneCategories";
import { ScenePreview } from "@/components/workspace/ScenePreview";

export type UserScenePickerEntry = {
  id: OllieSceneId;
  label: string;
  imageUrl: string;
};

type ScenePickerModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Which scene shows the green border (e.g. top layer). Set `false` when adding another layer. */
  selectedId?: OllieSceneId | false;
  onSelect: (id: OllieSceneId) => void;
  /** Signed-in user’s uploaded backdrops (My Scenes). */
  userScenes?: readonly UserScenePickerEntry[];
  onOpenUpload?: () => void;
  canUpload?: boolean;
};

type FilterValue = SceneCategoryId | "all";

export function ScenePickerModal({
  open,
  onClose,
  title = "Choose a Scene",
  selectedId,
  onSelect,
  userScenes = [],
  onOpenUpload,
  canUpload = false,
}: ScenePickerModalProps) {
  const titleId = useId();
  const filterRegionId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>("all");

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
    if (open) setCategoryFilter("all");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filteredCatalogScenes = useMemo(() => {
    if (categoryFilter === "my_scenes") return [];
    return OLLIE_SCENES.filter((scene) =>
      sceneMatchesCategory(scene.id, categoryFilter),
    );
  }, [categoryFilter]);

  const filteredUserScenes = useMemo(() => {
    if (categoryFilter === "my_scenes" || categoryFilter === "all") {
      return userScenes;
    }
    return [];
  }, [categoryFilter, userScenes]);

  const showEmpty =
    filteredCatalogScenes.length === 0 && filteredUserScenes.length === 0;

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
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {canUpload && onOpenUpload ? (
              <button
                type="button"
                onClick={onOpenUpload}
                title="Upload your own PNG backdrop"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-3"
              >
                <ImageUp className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                <span className="hidden sm:inline">Upload scene</span>
                <span className="sm:hidden">Upload</span>
              </button>
            ) : null}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl leading-none text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div
          className="shrink-0 border-b border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 sm:px-4"
          role="region"
          aria-label="Scene categories"
          id={filterRegionId}
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Category
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <FilterChip
              label="All"
              selected={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            />
            {SCENE_CATEGORY_IDS.map((id) => (
              <FilterChip
                key={id}
                label={SCENE_CATEGORY_LABELS[id]}
                selected={categoryFilter === id}
                onClick={() => setCategoryFilter(id)}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          {showEmpty ? (
            <p className="py-8 text-center text-sm text-[#64748b]">
              {categoryFilter === "my_scenes"
                ? "No uploaded scenes yet. Use Upload scene to add a PNG backdrop."
                : "No scenes in this category. Try another filter or All."}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5 md:gap-3 [grid-auto-rows:minmax(0,auto)]">
              {filteredCatalogScenes.map((scene) => {
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
              {filteredUserScenes.map((scene) => {
                const selected = selectedId !== false && scene.id === selectedId;
                const def = buildUserUploadedBackdropSceneDef(
                  scene.id,
                  scene.imageUrl,
                  scene.label,
                );
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
                      <ScenePreview scene={def} />
                    </div>
                    <span className="truncate px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-[#111827] sm:text-[11px]">
                      {scene.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-left text-[11px] font-semibold transition sm:px-3 sm:text-xs",
        selected
          ? "border-[#84c126] bg-[#ecfccb] text-[#365314] shadow-sm"
          : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc]",
      ].join(" ")}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
