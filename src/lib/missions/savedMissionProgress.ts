import type { SavedMissionProgressEntry } from "@/types/ollie";

const STORAGE_KEY = "ollie-saved-mission-progress";

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
            typeof (x as SavedMissionProgressEntry).displayName === "string"),
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

/** Remove one adventure from the local named-save list (browser). */
export function removeSavedMissionProgressEntry(missionId: string): void {
  const next = getSavedMissionProgress().filter((e) => e.missionId !== missionId);
  persist(next);
}

/** Record a named save for an adventure (one row per missionId, latest wins). */
export function recordMissionSaved(
  missionId: string,
  displayName: string,
): void {
  const name = displayName.trim();
  if (!name) return;
  persist(
    mergeMissionProgressLists(getSavedMissionProgress(), [
      {
        missionId,
        savedAt: new Date().toISOString(),
        displayName: name,
      },
    ]),
  );
}
