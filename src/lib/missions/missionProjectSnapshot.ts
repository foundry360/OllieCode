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

/**
 * Like {@link storeMissionProjectSnapshotLocal} but skips writes when existing local
 * snapshot is newer than `incoming` (by `updatedAt`). Prevents a slow cloud prefetch
 * from overwriting a just-saved backdrop thumbnail.
 * @returns whether local storage was updated.
 */
export function storeMissionProjectSnapshotIfNewer(
  missionId: string,
  incoming: ProjectPayload,
): boolean {
  const prev = loadMissionProjectSnapshotLocal(missionId);
  if (prev) {
    const a = prev.updatedAt;
    const b = incoming.updatedAt;
    if (typeof a === "string" && typeof b === "string") {
      try {
        const ta = Date.parse(a);
        const tb = Date.parse(b);
        if (
          Number.isFinite(ta) &&
          Number.isFinite(tb) &&
          ta > tb
        ) {
          return false;
        }
      } catch {
        /* keep */
      }
    }
  }
  storeMissionProjectSnapshotLocal(missionId, incoming);
  return true;
}

export function loadMissionProjectSnapshotLocal(
  missionId: string,
): ProjectPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(missionSnapshotStorageKey(missionId));
    if (raw == null) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed) as ProjectPayload;
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

/** Remove every `ollie-mission-payload-*` snapshot (e.g. when switching accounts on this browser). */
export function clearAllMissionProjectSnapshotsLocal(): void {
  if (typeof window === "undefined") return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Supabase project id for an adventure workspace file (path stays {userId}/{id}.json). */
export function missionCloudProjectId(missionId: string): string {
  return `mission-${missionId}`;
}
