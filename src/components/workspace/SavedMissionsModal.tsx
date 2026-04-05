"use client";

import { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { ScenePreview } from "@/components/workspace/ScenePreview";
import {
  DEFAULT_SCENE_ID,
  getSceneById,
  migrateSceneIdFromStorage,
  type SceneDef,
} from "@/lib/canvas/stageAssets";
import {
  isCustomMissionId,
  loadMissionProjectSnapshotLocal,
  MISSIONS,
} from "@/lib/missions";
import type { SavedMissionProgressEntry } from "@/types/ollie";

type SavedMissionsModalProps = {
  open: boolean;
  onClose: () => void;
  entries: SavedMissionProgressEntry[];
  onSelectMission: (missionId: string) => void;
  /** Mission id from the URL — highlights the active row. */
  activeMissionId: string | null;
};

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
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

function sceneForMissionId(missionId: string): SceneDef {
  const snap = loadMissionProjectSnapshotLocal(missionId);
  const id = migrateSceneIdFromStorage(snap?.sceneId);
  return getSceneById(id) ?? getSceneById(DEFAULT_SCENE_ID)!;
}

function MissionCard({
  missionId,
  name,
  metaLine,
  savedAtIso,
  isActive,
  onSelect,
}: {
  missionId: string;
  name: string;
  metaLine?: string | null;
  savedAtIso?: string | null;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const scene = sceneForMissionId(missionId);

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => onSelect(missionId)}
        className={[
          "flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2",
          isActive
            ? "border-[#84c126] bg-[#f7fee7] ring-2 ring-[#84c126]/35"
            : "border-[#e5e7eb] bg-white hover:border-[#84c126]/45 hover:shadow-md",
        ].join(" ")}
      >
        <div className="relative h-[100px] w-full shrink-0 overflow-hidden rounded-t-2xl bg-[#f1f5f9]">
          <ScenePreview scene={scene} className="h-full w-full object-cover" />
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
    </li>
  );
}

export function SavedMissionsModal({
  open,
  onClose,
  entries,
  onSelectMission,
  activeMissionId,
}: SavedMissionsModalProps) {
  const titleId = useId();

  const savedByMissionId = useMemo(() => {
    const map = new Map<string, SavedMissionProgressEntry>();
    for (const e of entries) map.set(e.missionId, e);
    return map;
  }, [entries]);

  const catalogIdSet = useMemo(
    () => new Set(MISSIONS.map((m) => m.id)),
    [],
  );

  const extraSavedEntries = useMemo(
    () => entries.filter((e) => !catalogIdSet.has(e.missionId)),
    [entries, catalogIdSet],
  );

  const hasAnyMission =
    MISSIONS.length > 0 || extraSavedEntries.length > 0;

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
      className="fixed inset-0 z-[200020] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="shrink-0 rounded-t-3xl border-b border-[#e5e7eb] bg-gradient-to-r from-[#f7fee7]/90 to-white px-5 py-4 sm:px-6">
          <h2
            id={titleId}
            className="font-display text-xl font-bold text-[#111827] sm:text-2xl"
          >
            Missions
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6b7280]">
            Tap a card to open that mission. Use{" "}
            <strong className="text-[#365314]">Save</strong> so your scene and
            blocks stay put.
          </p>
        </div>

        <div className="ollie-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          {!hasAnyMission ? (
            <p className="rounded-2xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-8 text-center text-sm text-[#6b7280]">
              No missions are available yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
              {MISSIONS.map((meta) => {
                const saved = savedByMissionId.get(meta.id);
                const isActive = activeMissionId === meta.id;
                const displayName = saved?.displayName?.trim()
                  ? saved.displayName.trim()
                  : meta.title;
                const metaLine = saved?.displayName?.trim()
                  ? meta.title
                  : null;
                return (
                  <MissionCard
                    key={meta.id}
                    missionId={meta.id}
                    name={displayName}
                    metaLine={metaLine}
                    savedAtIso={saved?.savedAt ?? null}
                    isActive={isActive}
                    onSelect={onSelectMission}
                  />
                );
              })}
              {extraSavedEntries.map((entry) => {
                const isActive = activeMissionId === entry.missionId;
                const displayName =
                  entry.displayName?.trim() || "Untitled mission";
                const metaLine = isCustomMissionId(entry.missionId)
                  ? "Your mission"
                  : null;
                return (
                  <MissionCard
                    key={entry.missionId}
                    missionId={entry.missionId}
                    name={displayName}
                    metaLine={metaLine}
                    savedAtIso={entry.savedAt}
                    isActive={isActive}
                    onSelect={onSelectMission}
                  />
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 rounded-b-3xl border-t border-[#e5e7eb] bg-[#fafafa] px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#e5e7eb] bg-white py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
