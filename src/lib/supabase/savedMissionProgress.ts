import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavedMissionProgressEntry } from "@/types/ollie";

type Row = {
  mission_id: string;
  display_name: string | null;
  saved_at: string;
};

export async function upsertSavedMissionProgress(
  supabase: SupabaseClient,
  userId: string,
  entry: SavedMissionProgressEntry,
): Promise<{ error: Error | null }> {
  const displayName = entry.displayName?.trim() || "Saved";
  const { error } = await supabase.from("saved_mission_progress").upsert(
    {
      user_id: userId,
      mission_id: entry.missionId,
      display_name: displayName,
      saved_at: entry.savedAt,
    },
    { onConflict: "user_id,mission_id" },
  );
  return { error: error ? new Error(error.message) : null };
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
  const { data, error } = await supabase
    .from("saved_mission_progress")
    .select("mission_id, display_name, saved_at")
    .eq("user_id", userId);
  if (error) return { data: [], error: new Error(error.message) };
  const entries: SavedMissionProgressEntry[] = (data as Row[] | null ?? []).map(
    (row) => ({
      missionId: row.mission_id,
      displayName: row.display_name ?? undefined,
      savedAt: row.saved_at,
    }),
  );
  return { data: entries, error: null };
}
