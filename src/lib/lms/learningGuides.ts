import type { SupabaseClient } from "@supabase/supabase-js";

/** Hub section headings, in display order (always shown, even when empty). */
export const LEARNING_GUIDE_SECTION_ORDER = [
  "Ollie Code Basics",
  "Safety & Security",
] as const;

export type LearningGuideListItem = {
  id: string;
  title: string;
  summary: string;
  cardImageUrl: string | null;
  sortOrder: number;
  section: string;
};

type GuideRow = {
  id: string;
  title: string;
  summary: string;
  card_image_url: string | null;
  sort_order: number;
  /** Present after `20260428160000_lms_learning_guides_section` migration. */
  section?: string | null;
};

function mapListRow(row: GuideRow): LearningGuideListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    cardImageUrl: row.card_image_url?.trim() || null,
    sortOrder: row.sort_order,
    section: row.section?.trim() || "Ollie Code Basics",
  };
}

/** Group published guides for the hub: fixed section order, then any other sections A–Z. */
export function groupLearningGuidesForHub(
  guides: LearningGuideListItem[],
): { section: string; guides: LearningGuideListItem[] }[] {
  const bySection = new Map<string, LearningGuideListItem[]>();
  for (const g of guides) {
    const sec = g.section.trim() || "Ollie Code Basics";
    const list = bySection.get(sec) ?? [];
    list.push(g);
    bySection.set(sec, list);
  }
  for (const list of bySection.values()) {
    list.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
    );
  }
  const seen = new Set<string>();
  const out: { section: string; guides: LearningGuideListItem[] }[] = [];
  for (const label of LEARNING_GUIDE_SECTION_ORDER) {
    seen.add(label);
    out.push({ section: label, guides: bySection.get(label) ?? [] });
  }
  for (const label of [...bySection.keys()].sort((a, b) => a.localeCompare(b))) {
    if (seen.has(label)) continue;
    out.push({ section: label, guides: bySection.get(label) ?? [] });
  }
  return out;
}

export async function fetchPublishedLearningGuides(
  supabase: SupabaseClient | null,
): Promise<LearningGuideListItem[]> {
  if (!supabase) {
    return [];
  }
  const { data, error } = await supabase
    .from("lms_learning_guides")
    .select("id, title, summary, card_image_url, sort_order, section")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error || !data) {
    return [];
  }
  return (data as GuideRow[]).map(mapListRow);
}

export type LearningGuideDetailRow = {
  id: string;
  title: string;
  body_html: string;
  updated_at: string;
};

export async function fetchLearningGuideByIdForViewer(
  supabase: SupabaseClient,
  id: string,
): Promise<LearningGuideDetailRow | null> {
  const { data, error } = await supabase
    .from("lms_learning_guides")
    .select("id, title, body_html, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as LearningGuideDetailRow;
  return row;
}
