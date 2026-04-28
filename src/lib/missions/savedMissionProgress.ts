import type { SavedMissionProgressEntry } from "@/types/ollie";
import { clearAllMissionProjectSnapshotsLocal } from "@/lib/missions/missionProjectSnapshot";

const STORAGE_KEY = "ollie-saved-mission-progress";

/** Which auth user last owned {@link STORAGE_KEY} on this browser (avoids showing another account’s adventure names). */
const OWNER_KEY = "ollie-saved-mission-progress-owner";

/** One-time per-browser: clear pre–account-scoped mission cache (see {@link syncSavedMissionStorageForAccount}). */
const MIGRATION_KEY = "ollie-saved-mission-progress-v2";

function mergeByLatestSavedAt(
  entries: SavedMissionProgressEntry[],
): SavedMissionProgressEntry[] {
  const map = new Map<string, SavedMissionProgressEntry>();
  for (const e of entries) {
    const prev = map.get(e.missionId);
    if (!prev || e.savedAt > prev.savedAt) map.set(e.missionId, e);
  }
  return [...map.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function mergeMissionProgressLists(
  ...lists: (SavedMissionProgressEntry[] | undefined)[]
): SavedMissionProgressEntry[] {
  const flat: SavedMissionProgressEntry[] = [];
  for (const l of lists) {
    if (l?.length) flat.push(...l);
  }
  return mergeByLatestSavedAt(flat);
}

/** Current list for UI and the next project save (browser localStorage hub). */
export function getSavedMissionProgress(): SavedMissionProgressEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || !raw.trim()) return [];
    const parsed = JSON.parse(raw.trim()) as unknown;
    if (!Array.isArray(parsed)) return [];
    return mergeByLatestSavedAt(
      parsed.filter(
        (x): x is SavedMissionProgressEntry =>
          x !== null &&
          typeof x === "object" &&
          typeof (x as SavedMissionProgressEntry).missionId === "string" &&
          typeof (x as SavedMissionProgressEntry).savedAt === "string" &&
          ((x as SavedMissionProgressEntry).displayName === undefined ||
            typeof (x as SavedMissionProgressEntry).displayName === "string") &&
          ((x as SavedMissionProgressEntry).hubLessonId === undefined ||
            typeof (x as SavedMissionProgressEntry).hubLessonId === "string"),
      ),
    );
  } catch {
    return [];
  }
}

function persist(entries: SavedMissionProgressEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota */
  }
}

export function mergeMissionProgressIntoStorage(
  incoming: SavedMissionProgressEntry[] | undefined,
): void {
  if (!incoming?.length) return;
  persist(mergeMissionProgressLists(getSavedMissionProgress(), incoming));
}

/**
 * Overwrite the local adventure-name list with cloud data after a successful fetch.
 * Prefer this over {@link mergeMissionProgressIntoStorage} when hydrating from Supabase
 * so rows deleted on the server (or other devices) are removed locally instead of lingering.
 */
export function replaceSavedMissionProgressFromServer(
  rows: SavedMissionProgressEntry[],
): void {
  persist(mergeByLatestSavedAt(rows));
}

/**
 * Call when the Supabase session’s user id changes (or on sign-out). Clears mission
 * name list + per-mission JSON snapshots if the account no longer matches the last
 * owner of this device’s cached adventure list.
 */
export function syncSavedMissionStorageForAccount(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!userId) {
      localStorage.removeItem(OWNER_KEY);
      localStorage.removeItem(STORAGE_KEY);
      clearAllMissionProjectSnapshotsLocal();
      return;
    }

    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
      clearAllMissionProjectSnapshotsLocal();
      localStorage.setItem(MIGRATION_KEY, "1");
    }

    const prev = localStorage.getItem(OWNER_KEY);
    if (prev && prev !== userId) {
      localStorage.removeItem(STORAGE_KEY);
      clearAllMissionProjectSnapshotsLocal();
    }
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    /* quota / private mode */
  }
}

/** Remove one adventure from the local named-save list (browser). */
export function removeSavedMissionProgressEntry(missionId: string): void {
  const next = getSavedMissionProgress().filter((e) => e.missionId !== missionId);
  persist(next);
}

export type RecordMissionSavedOpts = {
  /**
   * When a string: set hub lesson id from the current workspace `?lesson=`.
   * When `null`: clear (freeform adventure).
   * When omitted: keep the previous value for this `missionId` if any.
   */
  setHubLessonId?: string | null;
};

/** Record a named save for an adventure (one row per missionId, latest wins). */
export function recordMissionSaved(
  missionId: string,
  displayName: string,
  opts?: RecordMissionSavedOpts,
): void {
  const name = displayName.trim();
  if (!name) return;
  const existing = getSavedMissionProgress().find(
    (e) => e.missionId === missionId,
  );
  let hubLessonId: string | undefined;
  if (opts && "setHubLessonId" in opts) {
    if (opts.setHubLessonId === null) {
      hubLessonId = undefined;
    } else if (typeof opts.setHubLessonId === "string") {
      const t = opts.setHubLessonId.trim();
      hubLessonId = t.length > 0 ? t : existing?.hubLessonId;
    } else {
      hubLessonId = existing?.hubLessonId;
    }
  } else {
    hubLessonId = existing?.hubLessonId;
  }
  const row: SavedMissionProgressEntry = {
    missionId,
    savedAt: new Date().toISOString(),
    displayName: name,
    ...(hubLessonId ? { hubLessonId } : {}),
  };
  persist(mergeMissionProgressLists(getSavedMissionProgress(), [row]));
}
