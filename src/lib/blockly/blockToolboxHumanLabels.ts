import { getOllieBlockDefinitions } from "@/lib/blockly/ollieBlocks";

/**
 * Blocks registered in {@link registerOllieBlocks} after the JSON array (no `message0` in JSON).
 * Wording aligned with flyout labels in `ollieBlocks.ts`.
 */
const OLLIE_JS_ONLY_LABELS: Record<string, string> = {
  ollie_switch_costume: "switch costume to …",
  ollie_sensing_touching: "touching … ?",
  ollie_switch_scene: "switch scene to …",
  ollie_set_speech_bubble_color: "set speech bubble color to …",
};

/**
 * Blockly stock blocks used in {@link OLLIE_TOOLBOX} — short labels like the flyout (English).
 */
const BLOCKLY_STOCK_LABELS: Record<string, string> = {
  controls_if: "if …",
  controls_ifelse: "if … else",
  controls_whileUntil: "repeat while / until …",
  controls_repeat_ext: "repeat … times",
  controls_for: "count with … from … to … by …",
  controls_forEach: "for each … in list …",
  controls_flow_statements: "break out / continue",
  logic_compare: "… = ≠ < ≤ > ≥ …",
  logic_operation: "… and or …",
  logic_negate: "not …",
  logic_boolean: "true / false",
  logic_null: "null",
  logic_ternary: "test … if true … if false …",
  math_number: "number",
  math_arithmetic: "+ − × ÷ ^",
  math_single: "abs, sqrt, ln, …",
  math_trig: "sin cos tan …",
  math_constant: "π, e, …",
  math_number_property: "even, odd, prime, …",
  math_round: "round, ceil, floor",
  math_on_list: "sum, min, max, … of list",
  math_modulo: "remainder of … ÷ …",
  math_change: "change … by …",
  math_constrain: "constrain … low … high …",
  math_random_int: "random integer from … to …",
  math_random_float: "random fraction",
  math_atan2: "atan2 of x: … y: …",
  text: "text",
  text_join: "join text …",
  text_append: "append text …",
  text_length: "length of …",
  text_isEmpty: "… is empty?",
  text_indexOf: "first / last occurrence of text",
  text_charAt: "letter # in text",
  text_getSubstring: "substring of text",
  text_changeCase: "uppercase / lowercase / title case",
  text_trim: "trim spaces from both sides",
  text_print: "print …",
  text_prompt_ext: "ask for text with prompt …",
  lists_create_with: "create list with …",
  lists_repeat: "create list with item repeated … times",
  lists_length: "length of …",
  lists_isEmpty: "is list empty?",
  lists_indexOf: "first / last index of item in list",
  lists_getIndex: "get item from list",
  lists_setIndex: "set / insert item in list",
  lists_getSublist: "get sublist from list",
  lists_split: "split text with delimiter",
  lists_sort: "sort list …",
  colour_picker: "color",
  colour_random: "random color",
  colour_rgb: "color rgb …",
  colour_blend: "blend color …",
};

let ollieJsonLabelCache: ReadonlyMap<string, string> | null = null;

function ollieJsonLabels(): ReadonlyMap<string, string> {
  if (ollieJsonLabelCache) return ollieJsonLabelCache;
  const m = new Map<string, string>();
  for (const def of getOllieBlockDefinitions()) {
    if (!def || typeof def !== "object" || !("type" in def) || !("message0" in def)) continue;
    const type = (def as { type: string }).type;
    const message0 = (def as { message0: string }).message0;
    m.set(
      type,
      message0.replace(/%\d+/g, "…").replace(/\s+/g, " ").trim(),
    );
  }
  ollieJsonLabelCache = m;
  return m;
}

function titleCaseFallback(blockType: string): string {
  return blockType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Title-case a single leading letter (Scratch-style blocks often start lowercase in JSON). */
function polishLeadingLetter(label: string): string {
  const c = label.charAt(0);
  if (/[a-z]/.test(c)) return c.toUpperCase() + label.slice(1);
  return label;
}

/**
 * Human-readable label for a toolbox block type, similar to the flyout (placeholders shown as …).
 */
export function getToolboxBlockHumanLabel(blockType: string): string {
  const js = OLLIE_JS_ONLY_LABELS[blockType];
  if (js) return polishLeadingLetter(js);
  const fromJson = ollieJsonLabels().get(blockType);
  if (fromJson) return polishLeadingLetter(fromJson);
  const stock = BLOCKLY_STOCK_LABELS[blockType];
  if (stock) return polishLeadingLetter(stock);
  return titleCaseFallback(blockType);
}
