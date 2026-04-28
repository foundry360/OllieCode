import type { SupabaseClient } from "@supabase/supabase-js";
import { authEmailLocalPart } from "@/lib/auth/authEmailDomain";
import {
  lessonDetailHref,
  levelNameForSkillLevel,
  REMOVED_PLATFORM_LESSON_IDS,
} from "@/lib/lms/lessonsCatalog";
import { getMergedPublishedLessons } from "@/lib/lms/publishedLessons";
import { getAvatarBySlug } from "@/lib/profiles/avatarAssets";

export type ProfileAdventureRow = {
  mission_id: string;
  display_name: string;
  saved_at: string;
};

export type ProfileBadgeRow = {
  slug: string;
  title: string;
  description: string;
  icon_emoji: string;
  earned_at: string;
};

/** Header row: codename, avatar art URL, and highest skill tier from earned badges (defaults to 1). */
export type ProfileIdentity = {
  codename: string;
  avatarImageSrc: string | null;
  skillLevel: number;
  levelLabel: string;
};

async function fetchMaxSkillLevelFromEarnedBadges(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data: earned, error: e1 } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (e1 || !earned?.length) return 1;

  const ids = [...new Set(earned.map((r: { badge_id: string }) => r.badge_id))];
  const { data: rows, error: e2 } = await supabase
    .from("badges")
    .select("skill_level")
    .in("id", ids);

  if (e2 || !rows?.length) return 1;
  const levels = (rows as { skill_level: number }[]).map((r) => r.skill_level);
  return Math.max(1, ...levels);
}

export async function fetchProfileIdentity(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
): Promise<ProfileIdentity> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_slug")
    .eq("id", userId)
    .maybeSingle();

  const codename =
    (profile?.username as string | null | undefined)?.trim() ||
    authEmailLocalPart(email);

  const avatar = getAvatarBySlug(
    (profile?.avatar_slug as string | null | undefined) ?? null,
  );
  const skillLevel = await fetchMaxSkillLevelFromEarnedBadges(supabase, userId);

  return {
    codename,
    avatarImageSrc: avatar?.src ?? null,
    skillLevel,
    levelLabel: levelNameForSkillLevel(skillLevel),
  };
}

export async function fetchProfileAdventures(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileAdventureRow[]> {
  const { data, error } = await supabase
    .from("saved_mission_progress")
    .select("mission_id, display_name, saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return data as ProfileAdventureRow[];
}

export async function fetchLessonPointsTotal(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("user_lesson_completions")
    .select("points_earned")
    .eq("user_id", userId);

  if (error || !data?.length) return 0;
  return data.reduce(
    (sum, row: { points_earned: number }) => sum + (row.points_earned ?? 0),
    0,
  );
}

export async function fetchProfileBadges(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileBadgeRow[]> {
  const { data: earned, error: e1 } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (e1 || !earned?.length) return [];

  const ids = [
    ...new Set(
      (earned as { badge_id: string }[]).map((r) => r.badge_id),
    ),
  ];
  const { data: badgeRows, error: e2 } = await supabase
    .from("badges")
    .select("id, slug, title, description, icon_emoji")
    .in("id", ids);

  if (e2 || !badgeRows?.length) return [];

  const byId = new Map(
    (badgeRows as {
      id: string;
      slug: string;
      title: string;
      description: string;
      icon_emoji: string;
    }[]).map((b) => [b.id, b]),
  );

  const rows: ProfileBadgeRow[] = [];
  for (const row of earned as { badge_id: string; earned_at: string }[]) {
    const b = byId.get(row.badge_id);
    if (!b) continue;
    rows.push({
      slug: b.slug,
      title: b.title,
      description: b.description,
      icon_emoji: b.icon_emoji,
      earned_at: row.earned_at,
    });
  }
  return rows;
}

export type ProfileFavoriteLesson = {
  lessonId: string;
  title: string;
  href: string;
  createdAt: string;
};

export async function fetchFavoriteLessonIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_favorite_lessons")
    .select("lesson_id")
    .eq("user_id", userId);

  if (error || !data?.length) return new Set();
  return new Set(
    (data as { lesson_id: string }[])
      .map((r) => r.lesson_id)
      .filter((id) => !REMOVED_PLATFORM_LESSON_IDS.has(id)),
  );
}

export async function fetchProfileFavoriteLessons(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileFavoriteLesson[]> {
  const { data, error } = await supabase
    .from("user_favorite_lessons")
    .select("lesson_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const merged = await getMergedPublishedLessons();
  const byId = new Map(merged.map((l) => [l.id, l]));

  return (data as { lesson_id: string; created_at: string }[])
    .filter((row) => !REMOVED_PLATFORM_LESSON_IDS.has(row.lesson_id))
    .map((row) => ({
      lessonId: row.lesson_id,
      title: byId.get(row.lesson_id)?.title ?? row.lesson_id,
      href: lessonDetailHref(row.lesson_id),
      createdAt: row.created_at,
    }));
}
