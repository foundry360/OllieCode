import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * User-painted costume PNGs live under the same Storage bucket as project JSON (`projects`).
 * Path: `{userId}/painted-costumes/{uuid}.png`
 *
 * For `getPublicUrl` to load in `<img>` and p5, the bucket (or this prefix) should allow
 * public read — adjust Supabase Storage policies accordingly.
 */
const BUCKET = "projects";

export async function uploadPaintedCostumePng(
  supabase: SupabaseClient,
  userId: string,
  pngBlob: Blob,
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const fileName = `${crypto.randomUUID()}.png`;
  const path = `${userId}/painted-costumes/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, pngBlob, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) {
    return { publicUrl: null, error: new Error(error.message) };
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, error: null };
}
