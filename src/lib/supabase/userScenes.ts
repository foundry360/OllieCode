import type { SupabaseClient } from "@supabase/supabase-js";
import { makeUserSceneLayerId } from "@/lib/canvas/userSceneIds";
import type { UserSceneProjectEntry } from "@/types/ollie";
import { mintProjectsObjectSignedUrl } from "@/lib/supabase/costumePaintStorage";

/** Row from `user_scenes` plus a display URL (signed). */
export type UserSceneLibraryRow = {
  id: string;
  storage_path: string;
  display_name: string;
  signed_url: string;
};

export async function fetchUserSceneLibrary(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSceneLibraryRow[]> {
  const { data, error } = await supabase
    .from("user_scenes")
    .select("id, storage_path, display_name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[user_scenes] fetch failed:", error.message);
    return [];
  }
  if (!data?.length) return [];

  const out: UserSceneLibraryRow[] = [];
  for (const row of data) {
    const path = row.storage_path?.trim();
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!path || !id) continue;
    const signed = await mintProjectsObjectSignedUrl(supabase, path);
    if (!signed) continue;
    out.push({
      id,
      storage_path: path,
      display_name:
        typeof row.display_name === "string" && row.display_name.trim()
          ? row.display_name.trim()
          : "My scene",
      signed_url: signed,
    });
  }
  return out;
}

export async function insertUserSceneRow(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    id: string;
    storage_path: string;
    display_name: string;
  },
): Promise<{ error: Error | null }> {
  const name = payload.display_name.trim().slice(0, 80);
  if (!name) {
    return { error: new Error("Scene name is empty") };
  }
  const path = payload.storage_path.trim();
  if (!path) {
    return { error: new Error("Storage path is empty") };
  }
  const id = payload.id.trim();
  if (!id) {
    return { error: new Error("Scene id is empty") };
  }

  const { error } = await supabase.from("user_scenes").insert({
    id,
    user_id: userId,
    storage_path: path,
    display_name: name,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: null };
    }
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export type UserSceneRuntimeEntry = {
  layerId: string;
  storage_path: string;
  display_name: string;
  signed_url: string;
};

export function userSceneLibraryRowsToRuntime(
  rows: UserSceneLibraryRow[],
): UserSceneRuntimeEntry[] {
  return rows.map((r) => ({
    layerId: makeUserSceneLayerId(r.id),
    storage_path: r.storage_path,
    display_name: r.display_name,
    signed_url: r.signed_url,
  }));
}

export async function hydrateUserSceneProjectEntries(
  supabase: SupabaseClient,
  rows: UserSceneProjectEntry[],
): Promise<UserSceneRuntimeEntry[]> {
  const out: UserSceneRuntimeEntry[] = [];
  for (const r of rows) {
    const path = r.storage_path?.trim();
    if (!path) continue;
    const signed = await mintProjectsObjectSignedUrl(supabase, path);
    if (!signed) continue;
    out.push({
      layerId: r.id.trim(),
      storage_path: path,
      display_name: r.display_name?.trim() || "My scene",
      signed_url: signed,
    });
  }
  return out;
}

export function mergeUserSceneRuntimeByLayerId(
  ...lists: UserSceneRuntimeEntry[][]
): UserSceneRuntimeEntry[] {
  const m = new Map<string, UserSceneRuntimeEntry>();
  for (const list of lists) {
    for (const e of list) {
      m.set(e.layerId, e);
    }
  }
  return [...m.values()];
}

export function buildUserScenesProjectSlice(
  stageLayerIds: readonly string[],
  runtimeList: readonly UserSceneRuntimeEntry[],
): UserSceneProjectEntry[] {
  const map = new Map(runtimeList.map((e) => [e.layerId, e]));
  const out: UserSceneProjectEntry[] = [];
  const seen = new Set<string>();
  for (const id of stageLayerIds) {
    const e = map.get(id);
    if (!e || seen.has(e.layerId)) continue;
    seen.add(e.layerId);
    out.push({
      id: e.layerId,
      storage_path: e.storage_path,
      display_name: e.display_name,
    });
  }
  return out;
}
