/**
 * Visual step cards in the workspace lesson panel (one step at a time + Next).
 * Optional on {@link LessonCatalogEntry}; see `LESSONS` catalog entries.
 */

export type BlockCategoryKey =
  | "events"
  | "motion"
  | "looks"
  | "sound"
  | "control"
  | "operators"
  | "sensing"
  | "variables";

export type VisualLessonStep = {
  stepNumber: number;
  category: BlockCategoryKey;
  /** e.g. "EVENTS", "MOTION" — shown in category color */
  categoryLabel: string;
  /** Large instruction line */
  instruction: string;
  /** Supporting copy */
  description: string;
  /** Hat block (events) vs stack block */
  blockShape?: "hat" | "stack";
  /**
   * Single-line block text for hat blocks, e.g. "When clicked".
   * For stack blocks with inputs, use blockPrefix / blockSuffix + inputs.
   */
  blockLabel?: string;
  blockPrefix?: string;
  blockSuffix?: string;
  inputs?: { value: string }[];
};

export const BLOCK_COLORS: Record<
  BlockCategoryKey,
  { bg: string; border: string; inputBg: string }
> = {
  events: { bg: "#FFBF00", border: "#CC9900", inputBg: "#E6AC00" },
  motion: { bg: "#4C97FF", border: "#3373CC", inputBg: "#2E62CC" },
  looks: { bg: "#9966FF", border: "#7744CC", inputBg: "#7744CC" },
  sound: { bg: "#CF63CF", border: "#9B4B9B", inputBg: "#9B4B4B" },
  control: { bg: "#FFAB19", border: "#CF8B17", inputBg: "#E09520" },
  operators: { bg: "#59C059", border: "#389438", inputBg: "#389438" },
  sensing: { bg: "#5CB1D6", border: "#2E8EB8", inputBg: "#2E8EB8" },
  variables: { bg: "#FF8C1A", border: "#DB6E00", inputBg: "#DB6E00" },
};
