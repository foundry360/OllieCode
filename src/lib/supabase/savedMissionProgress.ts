import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavedMissionProgressEntry } from "@/types/ollie";

type Row = {
  mission_id: string;
  display_name: string | null;
  saved_at: string;
  hub_lesson_id?: string | null;
};

/**
 * True when PostgREST reports `hub_lesson_id` is unknown (migration not applied or schema
 * cache stale). Used to fall back to legacy upsert/select without that column.
 */
export function isMissingHubLessonIdColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("hub_lesson_id") &&
    (m.includes("schema cache") ||
      m.includes("does not exist") ||
      m.includes("could not find"))
  );
}

export async function upsertSavedMissionProgress(
  supabase: SupabaseClient,
  userId: string,
  entry: SavedMissionProgressEntry,
): Promise<{ error: Error | null }> {
  const displayName = entry.displayName?.trim() || "Saved";
  const hubLessonId = entry.hubLessonId?.trim() || null;
  const baseRow = {
    user_id: userId,
    mission_id: entry.missionId,
    display_name: displayName,
    saved_at: entry.savedAt,
  };
  const { error } = await supabase.from("saved_mission_progress").upsert(
    { ...baseRow, hub_lesson_id: hubLessonId },
    { onConflict: "user_id,mission_id" },
  );
  if (!error) return { error: null };
  if (isMissingHubLessonIdColumnError(error.message)) {
    const { error: retryErr } = await supabase
      .from("saved_mission_progress")
      .upsert(baseRow, { onConflict: "user_id,mission_id" });
    return { error: retryErr ? new Error(retryErr.message) : null };
  }
  return { error: new Error(error.message) };
}

export async function deleteSavedMissionProgress(
  supabase: SupabaseClient,
  userId: string,
  missionId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("saved_mission_progress")
    .delete()
    .eq("user_id", userId)
    .eq("mission_id", missionId);
  return { error: error ? new Error(error.message) : null };
}

export async function fetchSavedMissionProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: SavedMissionProgressEntry[]; error: Error | null }> {
  const withHub = await supabase
    .from("saved_mission_progress")
    .select("mission_id, display_name, saved_at, hub_lesson_id")
    .eq("user_id", userId);
  let rows: Row[] | null = (withHub.data as Row[] | null) ?? null;
  let fetchError = withHub.error;
  if (
    fetchError &&
    isMissingHubLessonIdColumnError(fetchError.message)
  ) {
    const legacy = await supabase
      .from("saved_mission_progress")
      .select("mission_id, display_name, saved_at")
      .eq("user_id", userId);
    rows = (legacy.data as Row[] | null) ?? null;
    fetchError = legacy.error;
  }
  if (fetchError) return { data: [], error: new Error(fetchError.message) };
  const entries: SavedMissionProgressEntry[] = (rows ?? []).map(
    (row) => ({
      missionId: row.mission_id,
      displayName: row.display_name ?? undefined,
      savedAt: row.saved_at,
      ...(row.hub_lesson_id?.trim()
        ? { hubLessonId: row.hub_lesson_id.trim() }
        : {}),
    }),
  );
  return { data: entries, error: null };
}
