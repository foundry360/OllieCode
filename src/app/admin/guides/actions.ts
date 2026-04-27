"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UploadLessonImageResult } from "@/app/admin/lessons/actions";
import { isAdminUser } from "@/lib/admin/isAdminUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, error: "No database" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Not signed in" };
  if (!(await isAdminUser(supabase, user)))
    return { supabase, user: null, error: "Forbidden" };
  return { supabase, user, error: null };
}

export type GuideActionResult = { ok: true } | { ok: false; message: string };

const LMS_ASSETS_BUCKET = "lms-assets";
const GUIDE_CARD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const GUIDE_CARD_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadLearningGuideCardImageAction(
  formData: FormData,
): Promise<UploadLessonImageResult> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, message: "No file selected." };
  }
  const ext = GUIDE_CARD_IMAGE_TYPES[file.type];
  if (!ext) {
    return { ok: false, message: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > GUIDE_CARD_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Image must be 5 MB or smaller." };
  }

  const r = await requireAdmin();
  if (r.error || !r.supabase) {
    return { ok: false, message: r.error ?? "Forbidden" };
  }

  const path = `learning-guide-cards/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  const { error } = await r.supabase.storage
    .from(LMS_ASSETS_BUCKET)
    .upload(path, body, { contentType: file.type, upsert: false });
  if (error) {
    const hint =
      /bucket not found/i.test(error.message) || error.message === "Bucket not found"
        ? ` Apply migration supabase/migrations/20260415100000_lms_assets_bucket.sql (e.g. supabase db push, or run that SQL in the Supabase Dashboard).`
        : "";
    return { ok: false, message: error.message + hint };
  }

  const { data } = r.supabase.storage.from(LMS_ASSETS_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    return { ok: false, message: "Could not get public URL for upload." };
  }
  return { ok: true, url: data.publicUrl };
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/;

function normalizeGuideId(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!ID_RE.test(s)) return null;
  return s;
}

export async function upsertLearningGuideAction(formData: FormData): Promise<GuideActionResult> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const bodyHtml = String(formData.get("body_html") ?? "");
  const cardImageUrlRaw = String(formData.get("card_image_url") ?? "").trim();
  const cardImageUrl = cardImageUrlRaw.length > 0 ? cardImageUrlRaw : null;
  const published = formData.get("published") === "on" || formData.get("published") === "true";
  const sortOrderRaw = Number(formData.get("sort_order"));
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.trunc(sortOrderRaw) : 0;

  const id = normalizeGuideId(idRaw);
  if (!id) {
    return {
      ok: false,
      message:
        "Guide ID must be 2–80 characters: lowercase letters, numbers, and hyphens (no leading/trailing hyphen).",
    };
  }
  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  const r = await requireAdmin();
  if (r.error || !r.supabase) {
    return { ok: false, message: r.error ?? "Forbidden" };
  }

  const { error } = await r.supabase.from("lms_learning_guides").upsert(
    {
      id,
      title,
      summary,
      body_html: bodyHtml,
      card_image_url: cardImageUrl,
      published,
      sort_order: sortOrder,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/learn");
  revalidatePath("/admin/guides");
  revalidatePath(`/admin/guides/${id}/edit`);
  redirect(`/admin/guides/${encodeURIComponent(id)}/edit?saved=1`);
}

export async function deleteLearningGuideAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/guides");

  const r = await requireAdmin();
  if (r.error || !r.supabase) {
    redirect("/admin/guides?error=" + encodeURIComponent(r.error ?? "Forbidden"));
  }

  const { error } = await r.supabase.from("lms_learning_guides").delete().eq("id", id);
  if (error) {
    redirect("/admin/guides?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/learn");
  revalidatePath("/admin/guides");
  redirect("/admin/guides");
}
