"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScenePreview } from "@/components/workspace/ScenePreview";
import {
  ADVENTURES_MODAL_PREVIEW_SCENE_ID,
  DEFAULT_SCENE_ID,
  getSceneById,
  primaryBackdropIdFromProjectPayload,
  type SceneDef,
} from "@/lib/canvas/stageAssets";
import {
  getMissionById,
  isCustomMissionId,
  missionCloudProjectId,
} from "@/lib/missions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { downloadProjectJson } from "@/lib/supabase/projectStorage";
import type { ProfileAdventureRow } from "@/lib/supabase/lmsUserData";
import type { ProjectPayload } from "@/types/ollie";

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
      payload.userScenes,
    );
    return getSceneById(id) ?? getSceneById(DEFAULT_SCENE_ID)!;
  }
  return fallbackSceneForMission(missionId);
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
  userId,
}: {
  adventures: ProfileAdventureRow[];
  userId: string;
}) {
  const [cloudByMissionId, setCloudByMissionId] = useState<
    Record<string, ProjectPayload | null>
  >({});
  const [thumbsReady, setThumbsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setThumbsReady(false);
    setCloudByMissionId({});

    void (async () => {
      const sb = getSupabaseBrowserClient();
      if (!sb) {
        if (!cancelled) setThumbsReady(true);
        return;
      }
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user || user.id !== userId) {
        if (!cancelled) setThumbsReady(true);
        return;
      }

      const results = await Promise.all(
        adventures.map(async (a) => {
          const { data, error } = await downloadProjectJson(
            sb,
            user.id,
            missionCloudProjectId(a.mission_id),
          );
          return {
            missionId: a.mission_id,
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
      setThumbsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [adventures, userId]);

  return (
    <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2.5 md:gap-3 [grid-auto-rows:minmax(0,auto)]">
      {adventures.map((a) => {
        const { name, metaLine } = cardCopyForRow(a);
        const scene = sceneFromCloudPayload(
          cloudByMissionId[a.mission_id],
          a.mission_id,
        );
        const href = `/workspace?mission=${encodeURIComponent(a.mission_id)}`;
        return (
          <li key={`${a.mission_id}-${a.saved_at}`} className="min-w-0">
            <div className="flex flex-col overflow-hidden rounded-lg border-2 border-[#e5e7eb] bg-white text-left shadow-sm transition hover:border-[#cbd5e1] hover:shadow-sm">
              <Link
                href={href}
                className="flex w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
              >
                <div className="relative h-[100px] w-full shrink-0 overflow-hidden rounded-t-md bg-[#f1f5f9]">
                  {!thumbsReady ? (
                    <div
                      className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-100"
                      aria-hidden
                    />
                  ) : (
                    <ScenePreview
                      scene={scene}
                      className="h-full w-full object-cover"
                    />
                  )}
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
