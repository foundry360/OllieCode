import type { SupabaseClient } from "@supabase/supabase-js";
import type { StageActor } from "@/types/ollie";
import {
  deleteProjectsBucketObject,
  mintProjectsObjectSignedUrl,
} from "@/lib/supabase/costumePaintStorage";

export type UserSpriteSource = "paint" | "upload";

/** Row from `user_sprites` plus a display URL (signed). */
export type UserSpriteLibraryRow = {
  storage_path: string;
  display_name: string;
  signed_url: string;
};

/**
 * Load the signed-in user’s saved sprites (newest first). Skips rows if signing fails.
 */
export async function fetchUserSpriteLibrary(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSpriteLibraryRow[]> {
  const { data, error } = await supabase
    .from("user_sprites")
    .select("storage_path, display_name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[user_sprites] fetch failed:", error.message);
    return [];
  }
  if (!data?.length) {
    return [];
  }

  const out: UserSpriteLibraryRow[] = [];
  for (const row of data) {
    const path = row.storage_path?.trim();
    if (!path) continue;
    const signed = await mintProjectsObjectSignedUrl(supabase, path);
    if (!signed) continue;
    out.push({
      storage_path: path,
      display_name:
        typeof row.display_name === "string" && row.display_name.trim()
          ? row.display_name.trim()
          : "Sprite",
      signed_url: signed,
    });
  }
  return out;
}

/**
 * Persist a newly uploaded or painted costume so it appears under My Sprites across adventures.
 * Idempotent per storage path (unique constraint): duplicate insert is ignored.
 */
export async function insertUserSpriteRow(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    storage_path: string;
    display_name: string;
    source: UserSpriteSource;
  },
): Promise<{ error: Error | null }> {
  const name = payload.display_name.trim().slice(0, 48);
  if (!name) {
    return { error: new Error("Sprite name is empty") };
  }
  const path = payload.storage_path.trim();
  if (!path) {
    return { error: new Error("Storage path is empty") };
  }

  const { error } = await supabase.from("user_sprites").insert({
    user_id: userId,
    storage_path: path,
    display_name: name,
    source: payload.source,
  });

  if (error) {
    // 23505 = unique_violation — same file already recorded
    if (error.code === "23505") {
      return { error: null };
    }
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/**
 * Remove a row from `user_sprites` (if present) and delete the PNG from Storage.
 * Safe when the sprite exists only in the current project (no library row).
 */
export async function deleteUserSpriteFromLibrary(
  supabase: SupabaseClient,
  userId: string,
  storagePath: string,
): Promise<{ error: Error | null }> {
  const path = storagePath.trim();
  if (!path) {
    return { error: new Error("Storage path is empty") };
  }
  const { error: rowErr } = await supabase
    .from("user_sprites")
    .delete()
    .eq("user_id", userId)
    .eq("storage_path", path);
  if (rowErr) {
    return { error: new Error(rowErr.message) };
  }
  return deleteProjectsBucketObject(supabase, path);
}

export type UserSpritePickerEntryShape = {
  paintedCostumeUrl: string;
  label: string;
  paintedCostumeStoragePath?: string;
};

/**
 * Library rows (DB order, newest first) plus any in-project painted costumes not yet in the library.
 */
export function mergeUserSpritePickerEntries(
  library: UserSpriteLibraryRow[],
  actors: StageActor[],
): UserSpritePickerEntryShape[] {
  const pathsInLibrary = new Set(library.map((r) => r.storage_path));
  const result: UserSpritePickerEntryShape[] = library.map((row) => {
    const actor = actors.find(
      (a) => a.paintedCostumeStoragePath?.trim() === row.storage_path,
    );
    return {
      paintedCostumeUrl: row.signed_url,
      label: actor?.label?.trim() || row.display_name,
      paintedCostumeStoragePath: row.storage_path,
    };
  });

  const seenUrl = new Set(result.map((r) => r.paintedCostumeUrl));
  for (const a of actors) {
    const url = a.paintedCostumeUrl?.trim();
    if (!url) continue;
    const p = a.paintedCostumeStoragePath?.trim();
    if (p && pathsInLibrary.has(p)) continue;
    if (seenUrl.has(url)) continue;
    seenUrl.add(url);
    result.push({
      paintedCostumeUrl: url,
      label: a.label,
      ...(p ? { paintedCostumeStoragePath: p } : {}),
    });
  }
  return result;
}
