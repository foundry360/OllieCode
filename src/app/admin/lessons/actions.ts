"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin/isAdminUser";
import {
  buildDefaultLessonCatalogEntry,
  generateNewLessonId,
  parseLessonPayload,
  sanitizeLessonId,
  type NewLessonBasics,
} from "@/lib/lms/lessonPayload";
import {
  LESSON_SKILL_LEVEL_OPTIONS,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
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

export type ActionResult = { ok: true } | { ok: false; message: string };

export type UploadLessonImageResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

const LMS_ASSETS_BUCKET = "lms-assets";
const LESSON_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const LESSON_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadLessonImageAction(
  formData: FormData,
): Promise<UploadLessonImageResult> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, message: "No file selected." };
  }
  const ext = LESSON_IMAGE_TYPES[file.type];
  if (!ext) {
    return { ok: false, message: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > LESSON_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Image must be 5 MB or smaller." };
  }

  const r = await requireAdmin();
  if (r.error || !r.supabase) {
    return { ok: false, message: r.error ?? "Forbidden" };
  }

  const path = `lesson-media/${crypto.randomUUID()}.${ext}`;
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

export type CreateDraftLessonInput = {
  /** If omitted or empty, a unique id is generated from the title. */
  lessonIdRaw?: string | null;
  title: string;
  summary: string;
  /** Learning Hub category / topic filter */
  topic: string;
  skillLevel: number;
  cardImageUrl?: string | null;
  thumbnailUrl?: string | null;
  /**
   * When true, the lesson is visible on the Learning Hub immediately.
   * Default / false keeps it as a draft (same as explicit draft).
   */
  published?: boolean;
};

export async function upsertLessonAction(
  payload: LessonCatalogEntry,
  published: boolean,
): Promise<ActionResult> {
  const parsed = parseLessonPayload(payload);
  if (!parsed) {
    return { ok: false, message: "Invalid lesson payload." };
  }
  const r = await requireAdmin();
  if (r.error || !r.supabase || !r.user) {
    return { ok: false, message: r.error ?? "Forbidden" };
  }
  const { error } = await r.supabase.from("lms_lessons").upsert(
    {
      id: parsed.id,
      payload: parsed as unknown as Record<string, unknown>,
      published,
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false, message: error.message };
  revalidatePath("/learn");
  revalidatePath("/learn/" + parsed.id);
  revalidatePath("/admin/lessons");
  return { ok: true };
}

export async function createDraftLessonAction(
  input: CreateDraftLessonInput,
): Promise<ActionResult | void> {
  const {
    lessonIdRaw,
    title,
    summary,
    topic,
    skillLevel,
    cardImageUrl,
    thumbnailUrl,
    published: publishedFlag,
  } = input;
  const published = publishedFlag === true;
  const raw = lessonIdRaw?.trim() ?? "";
  let id: string | null = null;

  if (raw) {
    id = sanitizeLessonId(raw);
    if (!id) {
      return {
        ok: false,
        message:
          "Lesson id must be 2–64 characters: lowercase letters, numbers, and hyphens only (e.g. lvl1-my-adventure).",
      };
    }
  }

  const r = await requireAdmin();
  if (r.error || !r.supabase || !r.user) {
    return { ok: false, message: r.error ?? "Forbidden" };
  }

  if (raw && id) {
    const { data: existing } = await r.supabase
      .from("lms_lessons")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existing) {
      return {
        ok: false,
        message:
          "That lesson id already exists in the database. Edit it from the list instead.",
      };
    }
  } else {
    for (let attempt = 0; attempt < 24; attempt++) {
      const candidate = generateNewLessonId(title);
      const { data: existing } = await r.supabase
        .from("lms_lessons")
        .select("id")
        .eq("id", candidate)
        .maybeSingle();
      if (!existing) {
        id = candidate;
        break;
      }
    }
    if (!id) {
      return {
        ok: false,
        message:
          "Could not allocate a unique lesson id. Please try again in a moment.",
      };
    }
  }

  const topicTrimmed = topic.trim();
  if (!topicTrimmed) {
    return { ok: false, message: "Category is required." };
  }
  const levelNum = Math.floor(Number(skillLevel));
  const maxLevel = Math.max(...LESSON_SKILL_LEVEL_OPTIONS);
  const minLevel = Math.min(...LESSON_SKILL_LEVEL_OPTIONS);
  if (
    !Number.isFinite(skillLevel) ||
    levelNum < minLevel ||
    levelNum > maxLevel
  ) {
    return { ok: false, message: "Choose a valid level." };
  }

  const basics: NewLessonBasics = {
    summary,
    topic: topicTrimmed,
    skillLevel: levelNum,
    cardImageUrl: cardImageUrl?.trim() || null,
    thumbnailUrl: thumbnailUrl?.trim() || null,
  };
  const payload = buildDefaultLessonCatalogEntry(id, title, basics);
  if (!parseLessonPayload(payload)) {
    return { ok: false, message: "Invalid lesson template." };
  }
  const { error } = await r.supabase.from("lms_lessons").insert({
    id,
    payload: payload as unknown as Record<string, unknown>,
    published,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/learn");
  revalidatePath("/learn/" + id);
  revalidatePath("/admin/lessons");
  redirect(`/admin/lessons/${encodeURIComponent(id)}/edit`);
}

export async function deleteLessonRowAction(lessonId: string): Promise<ActionResult> {
  const r = await requireAdmin();
  if (r.error || !r.supabase || !r.user) {
    return { ok: false, message: r.error ?? "Forbidden" };
  }
  const { error } = await r.supabase.from("lms_lessons").delete().eq("id", lessonId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/learn");
  revalidatePath("/admin/lessons");
  return { ok: true };
}
