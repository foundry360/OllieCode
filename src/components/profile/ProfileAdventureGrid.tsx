"use client";

import Link from "next/link";
import { ScenePreview } from "@/components/workspace/ScenePreview";
import {
  DEFAULT_SCENE_ID,
  getSceneById,
  migrateSceneIdFromStorage,
  type SceneDef,
} from "@/lib/canvas/stageAssets";
import {
  getMissionById,
  isCustomMissionId,
  loadMissionProjectSnapshotLocal,
} from "@/lib/missions";
import type { ProfileAdventureRow } from "@/lib/supabase/lmsUserData";

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

function sceneForMissionId(missionId: string): SceneDef {
  const snap = loadMissionProjectSnapshotLocal(missionId);
  const id = migrateSceneIdFromStorage(snap?.sceneId);
  return getSceneById(id) ?? getSceneById(DEFAULT_SCENE_ID)!;
}

function cardCopyForRow(a: ProfileAdventureRow): {
  name: string;
  metaLine: string | null;
} {
  const meta = getMissionById(a.mission_id);
  const trimmed = a.display_name.trim();
  if (meta) {
    const name = trimmed || meta.title;
    const metaLine = trimmed ? meta.title : null;
    return { name, metaLine };
  }
  return {
    name: trimmed || "Untitled adventure",
    metaLine: isCustomMissionId(a.mission_id) ? "Your Adventure" : null,
  };
}

export function ProfileAdventureGrid({
  adventures,
}: {
  adventures: ProfileAdventureRow[];
}) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2.5 md:gap-3 [grid-auto-rows:minmax(0,auto)]">
      {adventures.map((a) => {
        const { name, metaLine } = cardCopyForRow(a);
        const scene = sceneForMissionId(a.mission_id);
        const href = `/workspace?mission=${encodeURIComponent(a.mission_id)}`;
        return (
          <li key={`${a.mission_id}-${a.saved_at}`} className="min-w-0">
            <div className="flex flex-col overflow-hidden rounded-lg border-2 border-[#e5e7eb] bg-white text-left shadow-sm transition hover:border-[#cbd5e1] hover:shadow-sm">
              <Link
                href={href}
                className="flex w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
              >
                <div className="relative h-[100px] w-full shrink-0 overflow-hidden rounded-t-md bg-[#f1f5f9]">
                  <ScenePreview
                    scene={scene}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 px-3.5 py-3">
                  <span className="font-display text-base font-bold leading-snug text-[#111827]">
                    {name}
                  </span>
                  {metaLine ? (
                    <span className="text-xs font-medium text-[#9ca3af]">
                      {metaLine}
                    </span>
                  ) : null}
                  <span className="text-xs text-[#6b7280]">
                    <span className="font-semibold text-[#64748b]">Saved: </span>
                    {formatSavedAt(a.saved_at)}
                  </span>
                </div>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
