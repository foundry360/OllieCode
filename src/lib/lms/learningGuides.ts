import type { SupabaseClient } from "@supabase/supabase-js";

/** Shipped with the app so the hub shows this guide even before `lms_learning_guides` migrations run. */
export const HOW_TO_ACTIVATE_LESSON_GUIDE_ID = "how-to-activate-a-lesson" as const;

export type LearningGuideListItem = {
  id: string;
  title: string;
  summary: string;
  cardImageUrl: string | null;
  sortOrder: number;
};

const HOW_TO_ACTIVATE_LESSON_BODY_HTML =
  "<p>Use the <strong>Starter Lessons</strong> tab on the " +
  '<a href="/learn" rel="noopener noreferrer">Learning Hub</a>. This guide walks through turning a lesson card ' +
  "into an active build in the Workspace.</p>" +
  "<h2>1. Open the lesson page</h2>" +
  "<ol>" +
  "<li>Stay on (or switch to) <strong>Starter Lessons</strong>.</li>" +
  "<li>Scroll <strong>Popular lessons</strong> or use the list and filters below it.</li>" +
  "<li>Tap a lesson's green <strong>title</strong> to open its overview page.</li>" +
  "</ol>" +
  "<h2>2. Activate the lesson</h2>" +
  "<p>On the lesson page, look for the green <strong>Activate lesson</strong> button in the card on the left. " +
  "Tap it to jump into the Workspace with that lesson loaded so you can follow the steps and build along.</p>" +
  "<h2>3. If you see “Coming soon”</h2>" +
  "<p>Some lessons can be read on the hub but are not ready in the Workspace yet. Those show " +
  "<strong>Coming soon in the workspace</strong> instead of Activate lesson—you can still read the overview " +
  "and check back later.</p>" +
  "<h2>Tip</h2>" +
  "<p>For more family-friendly context, open the <strong>Learning Guides</strong> tab and browse other short reads.</p>";

const BUILTIN_PUBLISHED_LIST: LearningGuideListItem[] = [
  {
    id: HOW_TO_ACTIVATE_LESSON_GUIDE_ID,
    title: "How to activate a lesson",
    summary:
      "Go from the Learning Hub to the lesson page, then open the Workspace in one tap.",
    cardImageUrl: null,
    sortOrder: 0,
  },
];

function mergePublishedWithBuiltinDefaults(
  fromDb: LearningGuideListItem[],
): LearningGuideListItem[] {
  const byId = new Map(fromDb.map((g) => [g.id, g]));
  for (const b of BUILTIN_PUBLISHED_LIST) {
    if (!byId.has(b.id)) {
      byId.set(b.id, b);
    }
  }
  return [...byId.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
  );
}

type GuideRow = {
  id: string;
  title: string;
  summary: string;
  card_image_url: string | null;
  sort_order: number;
};

function mapListRow(row: GuideRow): LearningGuideListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    cardImageUrl: row.card_image_url,
    sortOrder: row.sort_order,
  };
}

export async function fetchPublishedLearningGuides(
  supabase: SupabaseClient | null,
): Promise<LearningGuideListItem[]> {
  if (!supabase) {
    return mergePublishedWithBuiltinDefaults([]);
  }
  const { data, error } = await supabase
    .from("lms_learning_guides")
    .select("id, title, summary, card_image_url, sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error || !data) {
    return mergePublishedWithBuiltinDefaults([]);
  }
  return mergePublishedWithBuiltinDefaults((data as GuideRow[]).map(mapListRow));
}

export type LearningGuideDetailRow = {
  id: string;
  title: string;
  body_html: string;
};

export async function fetchLearningGuideByIdForViewer(
  supabase: SupabaseClient,
  id: string,
): Promise<LearningGuideDetailRow | null> {
  const { data, error } = await supabase
    .from("lms_learning_guides")
    .select("id, title, body_html")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as LearningGuideDetailRow;
  return row;
}

/** Fallback when the row is not in the database (e.g. migration not applied yet). */
export function getBuiltinLearningGuideDetailForViewer(
  id: string,
): LearningGuideDetailRow | null {
  if (id !== HOW_TO_ACTIVATE_LESSON_GUIDE_ID) return null;
  return {
    id: HOW_TO_ACTIVATE_LESSON_GUIDE_ID,
    title: "How to activate a lesson",
    body_html: HOW_TO_ACTIVATE_LESSON_BODY_HTML,
  };
}
