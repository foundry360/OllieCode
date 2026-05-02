"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_COSTUME_ID,
  getCostumeById,
  isSpritePickerEntrySelected,
  OLLIE_SPRITE_PICKER_ENTRIES,
  SPRITE_CATEGORY_IDS,
  SPRITE_CATEGORY_LABELS,
  spriteCostumeMatchesCategory,
} from "@/lib/canvas/stageAssets";
import type {
  OllieSpriteCostumeId,
  SpriteCategoryId,
} from "@/lib/canvas/stageAssets";
import type { StageActor } from "@/types/ollie";
import { ImageUp, Plus, Trash2 } from "lucide-react";
import { SpritePreview, StageActorCostumePreview } from "@/components/workspace/SpritePreview";

/** User-uploaded or painted costumes from the current project (deduped by image URL). */
export type UserSpritePickerEntry = {
  paintedCostumeUrl: string;
  label: string;
  paintedCostumeStoragePath?: string;
};

export type SpritePickerSelection =
  | { kind: "catalog"; costumeId: OllieSpriteCostumeId }
  | {
      kind: "user";
      label: string;
      paintedCostumeUrl: string;
      paintedCostumeStoragePath?: string;
    };

type SpritePickerModalProps = {
  open: boolean;
  onClose: () => void;
  /** When null (e.g. adding a new sprite), no catalog option is shown as the current selection. */
  selectedId: OllieSpriteCostumeId | null;
  /** When the active sprite uses a user image, highlights the matching tile under All / My Sprites. */
  selectedPaintedCostumeUrl?: string | null;
  /** Distinct user-designed sprites (upload / paint) from the workspace. */
  userSprites: readonly UserSpritePickerEntry[];
  onSelect: (selection: SpritePickerSelection) => void;
  /** Opens the upload modal (drag/drop, name); parent sets new vs replace. */
  onOpenUpload?: () => void;
  /** Shown as the first tile under “My Sprites” — opens paint / create-sprite flow. */
  onOpenCreateSprite?: () => void;
  /**
   * When set, user tiles with {@link UserSpritePickerEntry.paintedCostumeStoragePath} show a
   * delete control (catalog sprites never delete).
   */
  onDeleteUserSprite?: (entry: UserSpritePickerEntry) => void;
};

type FilterValue = SpriteCategoryId | "all";

export function SpritePickerModal({
  open,
  onClose,
  selectedId,
  selectedPaintedCostumeUrl = null,
  userSprites,
  onSelect,
  onOpenUpload,
  onOpenCreateSprite,
  onDeleteUserSprite,
}: SpritePickerModalProps) {
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

  const catalogEntries = useMemo(() => {
    return OLLIE_SPRITE_PICKER_ENTRIES.filter((entry) =>
      spriteCostumeMatchesCategory(entry.costumeId, categoryFilter),
    );
  }, [categoryFilter]);

  const showUserSprites =
    categoryFilter === "all" || categoryFilter === "my_sprites";

  const rows = useMemo(() => {
    const catalog = catalogEntries.map((entry) => ({
      kind: "catalog" as const,
      entry,
    }));
    if (!showUserSprites) return catalog;
    const user = userSprites.map((entry) => ({
      kind: "user" as const,
      entry,
    }));
    return [...catalog, ...user];
  }, [catalogEntries, showUserSprites, userSprites]);

  const showMySpritesCreateTile =
    categoryFilter === "my_sprites" && Boolean(onOpenCreateSprite);

  const gridIsEmpty = rows.length === 0 && !showMySpritesCreateTile;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center p-4 sm:p-5"
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
        className="relative z-10 flex min-h-0 h-[82vh] max-h-[82dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[calc(100vw-2.5rem)] sm:max-w-[calc(100vw-2.5rem)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-t-2xl border-b border-[#6b9e1f] bg-[#84c126] px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-base font-bold text-white sm:text-lg">
            Choose a Sprite
          </h2>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {onOpenUpload ? (
              <button
                type="button"
                onClick={onOpenUpload}
                title="Upload your own PNG"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-3"
              >
                <ImageUp className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                <span className="hidden sm:inline">Upload image</span>
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
          aria-label="Sprite categories"
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
            {SPRITE_CATEGORY_IDS.map((id) => (
              <FilterChip
                key={id}
                label={SPRITE_CATEGORY_LABELS[id]}
                selected={categoryFilter === id}
                onClick={() => setCategoryFilter(id)}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          {gridIsEmpty ? (
            <p className="py-8 text-center text-sm text-[#64748b]">
              {categoryFilter === "my_sprites"
                ? "No My Sprites yet — paint a costume, upload a PNG, or pick All to browse the library."
                : "No sprites in this category. Try another filter or All."}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5 md:gap-3 [grid-auto-rows:minmax(0,auto)]">
              {showMySpritesCreateTile ? (
                <button
                  key="my-sprites-create"
                  type="button"
                  aria-label="Create a new sprite in the paint editor"
                  onClick={() => {
                    onOpenCreateSprite?.();
                    onClose();
                  }}
                  className="flex min-w-0 flex-col overflow-hidden rounded-lg border-2 border-dashed border-[#cbd5e1] bg-white text-left transition hover:border-[#84c126] hover:bg-[#f7fee7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                >
                  <div className="relative flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-md bg-[#f8fafc] p-1.5">
                    <Plus
                      className="size-9 text-[#cbd5e1] sm:size-10"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <span className="truncate px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-[#365314] sm:text-[11px]">
                    Create sprite
                  </span>
                </button>
              ) : null}
              {rows.map((row) => {
                if (row.kind === "catalog") {
                  const { entry } = row;
                  const costume = getCostumeById(entry.costumeId);
                  if (!costume) return null;
                  const selected = isSpritePickerEntrySelected(
                    entry.costumeId,
                    selectedId,
                  );
                  return (
                    <button
                      key={entry.costumeId}
                      type="button"
                      onClick={() => {
                        onSelect({ kind: "catalog", costumeId: entry.costumeId });
                        onClose();
                      }}
                      className={[
                        "flex min-w-0 flex-col overflow-hidden rounded-lg border-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2",
                        selected
                          ? "border-[#84c126] bg-[#f7fee7] shadow-sm"
                          : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1] hover:shadow-sm",
                      ].join(" ")}
                    >
                      <div className="relative aspect-square w-full min-w-0 overflow-hidden rounded-md bg-[#f1f5f9] p-1.5">
                        <SpritePreview costume={costume} fillCard />
                      </div>
                      <span className="truncate px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-[#111827] sm:text-[11px]">
                        {entry.label}
                      </span>
                    </button>
                  );
                }

                const { entry } = row;
                const key = `user:${entry.paintedCostumeUrl}`;
                const previewActor: StageActor = {
                  id: "sprite-picker-user-preview",
                  label: entry.label,
                  costumeId: DEFAULT_COSTUME_ID,
                  paintedCostumeUrl: entry.paintedCostumeUrl,
                  ...(entry.paintedCostumeStoragePath
                    ? { paintedCostumeStoragePath: entry.paintedCostumeStoragePath }
                    : {}),
                };
                const selected =
                  Boolean(selectedPaintedCostumeUrl) &&
                  entry.paintedCostumeUrl === selectedPaintedCostumeUrl;
                const storagePath = entry.paintedCostumeStoragePath?.trim();
                const showDelete =
                  Boolean(onDeleteUserSprite) && Boolean(storagePath);
                return (
                  <div
                    key={key}
                    className={[
                      "relative min-w-0 overflow-hidden rounded-lg border-2 text-left transition",
                      selected
                        ? "border-[#84c126] bg-[#f7fee7] shadow-sm"
                        : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1] hover:shadow-sm",
                    ].join(" ")}
                  >
                    {showDelete ? (
                      <button
                        type="button"
                        title={`Delete “${entry.label}”`}
                        aria-label={`Delete sprite ${entry.label}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteUserSprite?.(entry);
                        }}
                        className="absolute right-1 top-1 z-20 flex size-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-white/95 text-[#64748b] shadow-sm backdrop-blur-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
                      >
                        <Trash2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({
                          kind: "user",
                          label: entry.label,
                          paintedCostumeUrl: entry.paintedCostumeUrl,
                          paintedCostumeStoragePath: entry.paintedCostumeStoragePath,
                        });
                        onClose();
                      }}
                      className="flex min-w-0 w-full flex-col overflow-hidden rounded-[inherit] text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-inset"
                    >
                      <div className="relative aspect-square w-full min-w-0 overflow-hidden rounded-md bg-[#f1f5f9] p-1.5">
                        <StageActorCostumePreview actor={previewActor} fillCard />
                      </div>
                      <span className="truncate px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-[#111827] sm:text-[11px]">
                        {entry.label}
                      </span>
                    </button>
                  </div>
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
