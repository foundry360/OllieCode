"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import { ScenePreview } from "@/components/workspace/ScenePreview";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { downloadProjectJson } from "@/lib/supabase/projectStorage";
import {
  ADVENTURES_MODAL_PREVIEW_SCENE_ID,
  DEFAULT_SCENE_ID,
  getSceneById,
  primaryBackdropIdFromProjectPayload,
  type SceneDef,
} from "@/lib/canvas/stageAssets";
import {
  getMissionById,
  isCatalogTemplateMissionId,
  missionCloudProjectId,
  MISSIONS,
} from "@/lib/missions";
import type { ProjectPayload, SavedMissionProgressEntry } from "@/types/ollie";

type SavedMissionsModalProps = {
  open: boolean;
  onClose: () => void;
  entries: SavedMissionProgressEntry[];
  onSelectMission: (missionId: string) => void;
  /** Adventure id from the URL — highlights the active row. */
  activeMissionId: string | null;
  /** Open rename dialog (adventures with at least one save). */
  onRenameMission?: (missionId: string) => void;
};

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fallbackSceneForMission(missionId: string): SceneDef {
  const mission = getMissionById(missionId);
  const fallbackId =
    mission?.cardPreviewSceneId ?? ADVENTURES_MODAL_PREVIEW_SCENE_ID;
  return getSceneById(fallbackId) ?? getSceneById(DEFAULT_SCENE_ID)!;
}

function sceneFromCloudPayload(
  payload: ProjectPayload | null | undefined,
  missionId: string,
): SceneDef {
  if (payload) {
    const id = primaryBackdropIdFromProjectPayload(
      payload.sceneLayerIds,
      payload.sceneId,
    );
    return getSceneById(id) ?? getSceneById(DEFAULT_SCENE_ID)!;
  }
  return fallbackSceneForMission(missionId);
}

function MissionCard({
  missionId,
  name,
  metaLine,
  savedAtIso,
  isActive,
  onSelect,
  canRename,
  onRename,
  scene,
  thumbLoading,
}: {
  missionId: string;
  name: string;
  metaLine?: string | null;
  savedAtIso?: string | null;
  isActive: boolean;
  onSelect: (id: string) => void;
  canRename: boolean;
  onRename?: (id: string) => void;
  scene: SceneDef;
  thumbLoading: boolean;
}) {
  const showRename = canRename && onRename;

  return (
    <li className="min-w-0">
      <div
        className={[
          "flex flex-col overflow-hidden rounded-lg border-2 text-left shadow-sm transition focus-within:shadow-md",
          isActive
            ? "border-[#84c126] bg-[#f7fee7] shadow-sm"
            : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1] hover:shadow-sm",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => onSelect(missionId)}
          className="flex w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
        >
          <div className="relative h-[100px] w-full shrink-0 overflow-hidden rounded-t-md bg-[#f1f5f9]">
            {thumbLoading ? (
              <div
                className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-100"
                aria-hidden
              />
            ) : (
              <ScenePreview
                key={missionId}
                scene={scene}
                className="h-full w-full object-cover"
              />
            )}
            {isActive ? (
              <span className="absolute right-2 top-2 rounded-full bg-[#84c126] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                Open
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 px-3.5 py-3">
            <span className="font-display text-base font-bold leading-snug text-[#111827]">
              {name}
            </span>
            {metaLine ? (
              <span className="text-xs font-medium text-[#9ca3af]">{metaLine}</span>
            ) : null}
            <span className="text-xs text-[#6b7280]">
              {savedAtIso ? (
                <>
                  <span className="font-semibold text-[#64748b]">Saved: </span>
                  {formatSavedAt(savedAtIso)}
                </>
              ) : (
                <span className="text-[#9ca3af]">No saves yet</span>
              )}
            </span>
          </div>
        </button>
        {showRename ? (
          <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRename(missionId);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-[#365314] transition hover:bg-[#ecfccb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
            >
              <Pencil className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Rename
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function SavedMissionsModal({
  open,
  onClose,
  entries,
  onSelectMission,
  activeMissionId,
  onRenameMission,
}: SavedMissionsModalProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  /** Supabase Storage `mission-*.json` payloads — source of truth for card art. */
  const [cloudByMissionId, setCloudByMissionId] = useState<
    Record<string, ProjectPayload | null>
  >({});
  const [cloudThumbsReady, setCloudThumbsReady] = useState(true);

  const savedByMissionId = useMemo(() => {
    const map = new Map<string, SavedMissionProgressEntry>();
    for (const e of entries) map.set(e.missionId, e);
    return map;
  }, [entries]);

  const catalogIdSet = useMemo(
    () => new Set(MISSIONS.map((m) => m.id)),
    [],
  );

  /** Catalog rows (excludes starter templates like First Move — those open from the workspace only). */
  const visibleCatalogMissions = useMemo(
    () => MISSIONS.filter((m) => !isCatalogTemplateMissionId(m.id)),
    [],
  );

  /**
   * User-named copies only (`custom-…`). Catalog starters (including First Move) never appear here —
   * they open from the workspace; saves fork to a new custom id.
   */
  const extraSavedEntries = useMemo(
    () => entries.filter((e) => !catalogIdSet.has(e.missionId)),
    [entries, catalogIdSet],
  );

  const hasAnyMission =
    visibleCatalogMissions.length > 0 || extraSavedEntries.length > 0;

  const entriesKey = useMemo(
    () =>
      [...entries]
        .map((e) => e.missionId)
        .sort()
        .join(","),
    [entries],
  );

  useLayoutEffect(() => {
    if (!open) return;
    setCloudByMissionId({});
    setCloudThumbsReady(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    if (getSupabaseBrowserClient()) {
      setCloudThumbsReady(false);
    }

    void (async () => {
      const sb = getSupabaseBrowserClient();
      if (!sb) {
        if (!cancelled) setCloudThumbsReady(true);
        return;
      }
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        if (!cancelled) setCloudThumbsReady(true);
        return;
      }

      const ids = new Set<string>();
      for (const m of visibleCatalogMissions) ids.add(m.id);
      for (const e of entries) ids.add(e.missionId);

      const results = await Promise.all(
        [...ids].map(async (missionId) => {
          const { data, error } = await downloadProjectJson(
            sb,
            user.id,
            missionCloudProjectId(missionId),
          );
          return {
            missionId,
            payload: data && !error ? data : null,
          };
        }),
      );

      if (cancelled) return;
      const map: Record<string, ProjectPayload | null> = {};
      for (const { missionId, payload } of results) {
        map[missionId] = payload;
      }
      setCloudByMissionId(map);
      setCloudThumbsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, entriesKey, entries, visibleCatalogMissions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
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

  return createPortal(
    <div
      className="fixed inset-0 z-[200020] flex min-h-0 items-center justify-center p-4 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close adventures"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-hint`}
        className="relative z-10 flex min-h-0 h-[82vh] max-h-[82dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[calc(100vw-2.5rem)] sm:max-w-[calc(100vw-2.5rem)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-t-2xl border-b border-[#6b9e1f] bg-[#84c126] px-4 py-3 sm:px-5">
          <h2
            id={titleId}
            className="text-base font-bold text-white sm:text-lg"
          >
            Adventures
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
          <p
            id={`${titleId}-hint`}
            className="mb-3 text-sm leading-relaxed text-[#6b7280] sm:mb-4"
          >
            Open a saved adventure below, or go back to the workspace for the
            First Move starter. Use{" "}
            <strong className="font-semibold text-[#365314]">Save</strong> there
            to add your named copy here.
          </p>
          {!hasAnyMission ? (
            <p className="rounded-lg border-2 border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-8 text-center text-sm text-[#6b7280]">
              No adventures are available yet.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-2.5 md:gap-3 [grid-auto-rows:minmax(0,auto)]">
              {visibleCatalogMissions.map((meta) => {
                const saved = savedByMissionId.get(meta.id);
                const isActive = activeMissionId === meta.id;
                const displayName = saved?.displayName?.trim()
                  ? saved.displayName.trim()
                  : meta.title;
                const metaLine = saved?.displayName?.trim()
                  ? meta.title
                  : null;
                const payload = cloudByMissionId[meta.id];
                const scene = sceneFromCloudPayload(payload, meta.id);
                const thumbLoading = !cloudThumbsReady;
                return (
                  <MissionCard
                    key={meta.id}
                    missionId={meta.id}
                    name={displayName}
                    metaLine={metaLine}
                    savedAtIso={saved?.savedAt ?? null}
                    isActive={isActive}
                    onSelect={onSelectMission}
                    canRename={Boolean(saved?.savedAt)}
                    onRename={onRenameMission}
                    scene={scene}
                    thumbLoading={thumbLoading}
                  />
                );
              })}
              {extraSavedEntries.map((entry) => {
                const isActive = activeMissionId === entry.missionId;
                const displayName =
                  entry.displayName?.trim() || "Untitled adventure";
                const payload = cloudByMissionId[entry.missionId];
                const scene = sceneFromCloudPayload(payload, entry.missionId);
                const thumbLoading = !cloudThumbsReady;
                return (
                  <MissionCard
                    key={entry.missionId}
                    missionId={entry.missionId}
                    name={displayName}
                    metaLine="Your Adventure"
                    savedAtIso={entry.savedAt}
                    isActive={isActive}
                    onSelect={onSelectMission}
                    canRename
                    onRename={onRenameMission}
                    scene={scene}
                    thumbLoading={thumbLoading}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
