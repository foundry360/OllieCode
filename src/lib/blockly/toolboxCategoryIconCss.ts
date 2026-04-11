import { categoryIconSrcForStyle } from "@/lib/blockly/blockCategoryIcons";

/** Rendered size of toolbox category circle icons (SVG scales via `background-size`). */
const TOOLBOX_CATEGORY_ICON_PX = 32;

/** Extra vertical gap between toolbox categories; 0 uses Blockly’s default spacing only. */
const TOOLBOX_CATEGORY_ROW_GAP_PX = 0;

/**
 * Toolbox **sidebar only** — maps each category row to a block `style` for the circle+glyph
 * data URL (same palette as blocks, but icons are not drawn on blocks).
 * @see categoryIconSrcForStyle
 */
export const OLLIE_TOOLBOX_CATEGORY_ICON_MAP = {
  events: "scratch_events",
  motion: "scratch_motion",
  looks: "scratch_looks",
  sound: "scratch_sound",
  sensing: "scratch_sensing",
  control: "scratch_control",
  logic: "logic_blocks",
  loops: "loop_blocks",
  math: "math_blocks",
  text: "text_blocks",
  lists: "list_blocks",
  color: "colour_blocks",
  variables: "variable_blocks",
  "variables-dynamic": "variable_dynamic_blocks",
  functions: "procedure_blocks",
} as const;

export type OllieToolboxCategoryIconId = keyof typeof OLLIE_TOOLBOX_CATEGORY_ICON_MAP;

/** Merged with Blockly’s default toolbox category classes — adds per-row icon + strip styling. */
export function ollieToolboxCategoryCssconfig(id: OllieToolboxCategoryIconId) {
  return {
    row: `blocklyToolboxCategory ollie-toolbox-row ollie-toolbox-row--${id}`,
    icon: `blocklyToolboxCategoryIcon ollie-toolbox-cat ollie-toolbox-cat--${id}`,
  };
}

function buildToolboxCategoryIconCss(): string {
  const rules: string[] = [];
  const ids = Object.keys(OLLIE_TOOLBOX_CATEGORY_ICON_MAP) as OllieToolboxCategoryIconId[];
  for (const id of ids) {
    const style = OLLIE_TOOLBOX_CATEGORY_ICON_MAP[id];
    const url = categoryIconSrcForStyle(style);
    const u = JSON.stringify(url);
    rules.push(`
.ollie-blockly-host .blocklyToolboxCategoryIcon.ollie-toolbox-cat--${id} {
  visibility: visible !important;
  width: ${TOOLBOX_CATEGORY_ICON_PX}px !important;
  height: ${TOOLBOX_CATEGORY_ICON_PX}px !important;
  min-width: ${TOOLBOX_CATEGORY_ICON_PX}px;
  flex-shrink: 0;
  margin-inline-end: 8px;
  background-image: url(${u}) !important;
  background-size: ${TOOLBOX_CATEGORY_ICON_PX}px ${TOOLBOX_CATEGORY_ICON_PX}px;
  background-repeat: no-repeat;
  background-position: center center;
}
.ollie-blockly-host .blocklyToolboxCategory.ollie-toolbox-row--${id} {
  border-left: none !important;
  border-right: none !important;
}
`);
  }
  rules.push(`
.ollie-blockly-host .blocklyToolboxCategoryGroup > .blocklyToolboxCategoryContainer {
  margin-block-end: ${TOOLBOX_CATEGORY_ROW_GAP_PX}px;
  width: 100%;
  box-sizing: border-box;
}
.ollie-blockly-host .blocklyToolboxCategoryGroup > .blocklyToolboxCategoryContainer:last-child {
  margin-block-end: 0;
}
/* Blockly paints the category colour on the row when selected; keep the list neutral. */
.ollie-blockly-host .blocklyToolboxCategory.ollie-toolbox-row.blocklyToolboxSelected {
  background-color: transparent !important;
}
.ollie-blockly-host .blocklyToolboxCategory.ollie-toolbox-row.blocklyToolboxSelected .blocklyToolboxCategoryLabel {
  color: #575e75 !important;
}
.ollie-blockly-host .blocklyToolboxCategory.ollie-toolbox-row {
  height: auto !important;
  min-height: ${TOOLBOX_CATEGORY_ICON_PX + 12}px;
  line-height: 1.3 !important;
  margin-bottom: 0 !important;
  display: flex !important;
  align-items: center !important;
  padding-block: 4px;
  padding-inline: 0 10px;
  box-sizing: border-box !important;
  width: 100%;
}
.ollie-blockly-host .blocklyToolboxCategory.ollie-toolbox-row .blocklyTreeRowContentContainer {
  display: flex !important;
  align-items: center !important;
  flex: 1 1 auto;
  min-width: 0;
}
`);
  return rules.join("\n");
}

/**
 * Injected next to the Blockly host: toolbox icons are hidden and the colour “swatch” is a
 * border strip by default — this shows the circle icons and removes the strip.
 */
export const OLLIE_TOOLBOX_CATEGORY_ICON_CSS = buildToolboxCategoryIconCss();
