"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleLessonFavorite(lessonId: string, favorited: boolean) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user || !lessonId.trim()) return { ok: false as const };

  if (favorited) {
    const { error } = await supabase.from("user_favorite_lessons").upsert(
      { user_id: user.id, lesson_id: lessonId.trim() },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) return { ok: false as const };
  } else {
    const { error } = await supabase
      .from("user_favorite_lessons")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId.trim());
    if (error) return { ok: false as const };
  }

  revalidatePath("/learn");
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function removeFavoriteLessonFormAction(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  if (!lessonId) return;
  await toggleLessonFavorite(lessonId, false);
}
