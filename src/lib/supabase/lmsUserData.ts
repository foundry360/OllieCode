import type { SupabaseClient } from "@supabase/supabase-js";

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
