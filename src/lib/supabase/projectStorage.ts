import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectPayload } from "@/types/ollie";

/**
 * Save / load project JSON to Supabase Storage + optional table row.
 * Replace bucket name and paths with your Supabase setup; enable RLS policies for `projects` bucket.
 */
const BUCKET = "projects";

export async function uploadProjectJson(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  payload: ProjectPayload,
): Promise<{ error: Error | null }> {
  const path = `${userId}/${projectId}.json`;
  const body = JSON.stringify(payload);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: "application/json",
    upsert: true,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function deleteProjectJson(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<{ error: Error | null }> {
  const path = `${userId}/${projectId}.json`;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error ? new Error(error.message) : null };
}

export async function downloadProjectJson(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<{ data: ProjectPayload | null; error: Error | null }> {
  const path = `${userId}/${projectId}.json`;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) return { data: null, error: new Error(error.message) };
  const text = await data.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      data: null,
      error: new Error("Project file is empty"),
    };
  }
  try {
    return { data: JSON.parse(trimmed) as ProjectPayload, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

/**
 * Example: list projects for dashboard (requires a `projects` table or storage list).
 */
export async function listProjectKeys(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ keys: string[]; error: Error | null }> {
  const { data, error } = await supabase.storage.from(BUCKET).list(userId);
  if (error) return { keys: [], error: new Error(error.message) };
  return {
    keys: (data ?? []).map((f) => f.name.replace(/\.json$/, "")),
    error: null,
  };
}
