import type { SupabaseClient } from "@supabase/supabase-js";
import type { StageActor } from "@/types/ollie";

/**
 * User-painted costume PNGs live under the same Storage bucket as project JSON (`projects`).
 * Path: `{userId}/painted-costumes/{uuid}.png`
 *
 * Private buckets: use signed URLs for display (`getPublicUrl` alone returns a URL that 403s
 * without public read). We persist {@link StageActor.paintedCostumeStoragePath} and refresh
 * signed URLs when loading a project.
 */
const BUCKET = "projects";

/** Signed URL lifetime — long enough for classroom use; refreshed on project open. */
const SIGNED_URL_EXPIRY_SEC = 60 * 60 * 24 * 365;

const SIGN_URL_EXPIRY_ATTEMPTS_SEC = [
  SIGNED_URL_EXPIRY_SEC,
  60 * 60 * 24 * 7,
  60 * 60 * 24,
] as const;

/** Signed URL for a private `projects` bucket object (used by costumes + user sprite library). */
export async function mintProjectsObjectSignedUrl(
  supabase: SupabaseClient,
  path: string,
): Promise<string | null> {
  for (const exp of SIGN_URL_EXPIRY_ATTEMPTS_SEC) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, exp);
    if (!error && data?.signedUrl) return data.signedUrl;
  }
  return null;
}

/**
 * Extract `projects` bucket object path from a Supabase Storage URL (public or signed).
 * Returns e.g. `userId/painted-costumes/uuid.png`.
 */
export function inferProjectsBucketObjectPathFromUrl(
  url: string,
): string | null {
  try {
    const u = new URL(url);
    const pub = `/object/public/${BUCKET}/`;
    const pi = u.pathname.indexOf(pub);
    if (pi !== -1) {
      return decodeURIComponent(u.pathname.slice(pi + pub.length));
    }
    const sig = `/object/sign/${BUCKET}/`;
    const si = u.pathname.indexOf(sig);
    if (si !== -1) {
      return decodeURIComponent(u.pathname.slice(si + sig.length));
    }
  } catch {
    return null;
  }
  return null;
}

/** Remove one object from the private `projects` bucket (painted costumes, user sprites, etc.). */
export async function deleteProjectsBucketObject(
  supabase: SupabaseClient,
  path: string,
): Promise<{ error: Error | null }> {
  const trimmed = path.trim();
  if (!trimmed) return { error: new Error("Storage path is empty") };
  const { error } = await supabase.storage.from(BUCKET).remove([trimmed]);
  return { error: error ? new Error(error.message) : null };
}

/** User-uploaded backdrop PNGs: `{userId}/user-scenes/{sceneUuid}.png` */
export async function uploadUserScenePng(
  supabase: SupabaseClient,
  userId: string,
  sceneUuid: string,
  pngBlob: Blob,
): Promise<{
  publicUrl: string | null;
  storagePath: string | null;
  error: Error | null;
}> {
  const path = `${userId}/user-scenes/${sceneUuid}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, pngBlob, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) {
    return { publicUrl: null, storagePath: null, error: new Error(error.message) };
  }

  const signedUrl = await mintProjectsObjectSignedUrl(supabase, path);
  if (signedUrl) {
    return { publicUrl: signedUrl, storagePath: path, error: null };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    publicUrl: pub.publicUrl,
    storagePath: path,
    error: null,
  };
}

export async function uploadPaintedCostumePng(
  supabase: SupabaseClient,
  userId: string,
  pngBlob: Blob,
): Promise<{
  publicUrl: string | null;
  storagePath: string | null;
  error: Error | null;
}> {
  const fileName = `${crypto.randomUUID()}.png`;
  const path = `${userId}/painted-costumes/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, pngBlob, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) {
    return { publicUrl: null, storagePath: null, error: new Error(error.message) };
  }

  const signedUrl = await mintProjectsObjectSignedUrl(supabase, path);
  if (signedUrl) {
    return { publicUrl: signedUrl, storagePath: path, error: null };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    publicUrl: pub.publicUrl,
    storagePath: path,
    error: null,
  };
}

/**
 * Replace `paintedCostumeUrl` with a fresh signed URL when we have a storage path or can
 * infer it from an existing Supabase URL (e.g. after loading project JSON).
 */
export async function hydratePaintedCostumeUrls(
  supabase: SupabaseClient,
  actors: StageActor[],
): Promise<StageActor[]> {
  return Promise.all(
    actors.map(async (actor) => {
      const path =
        actor.paintedCostumeStoragePath?.trim() ||
        (actor.paintedCostumeUrl
          ? inferProjectsBucketObjectPathFromUrl(actor.paintedCostumeUrl)
          : null);
      if (!path) return actor;
      const nextUrl = await mintProjectsObjectSignedUrl(supabase, path);
      if (!nextUrl) return actor;
      return {
        ...actor,
        paintedCostumeUrl: nextUrl,
        paintedCostumeStoragePath: path,
      };
    }),
  );
}
