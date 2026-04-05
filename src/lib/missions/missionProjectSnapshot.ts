import type { ProjectPayload } from "@/types/ollie";

const KEY_PREFIX = "ollie-mission-payload-";

export function missionSnapshotStorageKey(missionId: string): string {
  return `${KEY_PREFIX}${missionId}`;
}

export function storeMissionProjectSnapshotLocal(
  missionId: string,
  payload: ProjectPayload,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      missionSnapshotStorageKey(missionId),
      JSON.stringify(payload),
    );
  } catch {
    /* quota */
  }
}

export function loadMissionProjectSnapshotLocal(
  missionId: string,
): ProjectPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(missionSnapshotStorageKey(missionId));
    if (!raw) return null;
    return JSON.parse(raw) as ProjectPayload;
  } catch {
    return null;
  }
}

export function clearMissionProjectSnapshotLocal(missionId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(missionSnapshotStorageKey(missionId));
  } catch {
    /* ignore */
  }
}

/** Supabase project id for a mission workspace file (path stays {userId}/{id}.json). */
export function missionCloudProjectId(missionId: string): string {
  return `mission-${missionId}`;
}
