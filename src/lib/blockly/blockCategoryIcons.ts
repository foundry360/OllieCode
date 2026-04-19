import { blockStyleColorPrimary } from "@/lib/blockly/ollieTheme";

const FALLBACK_STYLE_COLOR = "#9ca3af";

const W = "#ffffff";

/**
 * White glyph centered in an 18×18 view (circle drawn separately).
 * Keys align with {@link blockStyleColorPrimary}.
 * Used only for the **toolbox category list** — not on workspace blocks.
 */
const CATEGORY_ICON_INNER: Readonly<Record<string, string>> = {
  scratch_events: `<g fill="${W}"><rect x="4.15" y="3.35" width="1.45" height="11.3" rx="0.4"/><path d="M6.15 4.85V9.4l5.7-2.25-5.7-2.3z"/></g>`,
  scratch_motion: `<path fill="none" stroke="${W}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" d="M6.2 9h5.6M10.8 6.4L13.1 9l-2.3 2.6"/>`,
  scratch_looks: `<ellipse cx="9" cy="9" rx="3.4" ry="2" fill="none" stroke="${W}" stroke-width="1.15"/><circle cx="9" cy="9" r="1" fill="${W}"/>`,
  scratch_sound: `<g fill="none" stroke="${W}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 8.1v1.8h1.4l2.7 2.1V6l-2.7 2.1H4.9z"/><path d="M11.6 7.4c.8.8.8 2.4 0 3.2"/><path d="M12.7 6.3c1.2 1.2 1.2 3.4 0 4.6"/></g>`,
  scratch_control: `<path fill="none" stroke="${W}" stroke-width="1.25" stroke-linejoin="round" d="M9 5.15l3.1 2.25v3.2L9 12.85l-3.1-2.25v-3.2z"/>`,
  scratch_sensing: `<g fill="none" stroke="${W}" stroke-width="1.2" stroke-linecap="round"><circle cx="9" cy="8.3" r="2.6"/><path d="M6.8 12.2c.6.9 1.6 1.4 2.7 1.4 1 0 2-.5 2.6-1.3"/></g>`,
  logic_blocks: `<path fill="none" stroke="${W}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M5.8 6.4h6.4M5.8 11.6h6.4M5.8 6.4l6.4 5.2M12.2 6.4l-6.4 5.2"/>`,
  loop_blocks: `<path fill="none" stroke="${W}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M6.8 6.9A3.2 3.2 0 019 5.6a3.2 3.2 0 013.1 2M11.2 11.1A3.2 3.2 0 019 12.4a3.2 3.2 0 01-3.1-2"/><path d="M5.7 7.3l-.9-1.3h2.3" fill="none" stroke="${W}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.3 10.7l.9 1.3h-2.3" fill="none" stroke="${W}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  math_blocks: `<path fill="none" stroke="${W}" stroke-width="1.4" stroke-linecap="round" d="M9 5.4v7.2M5.4 9h7.2"/>`,
  text_blocks: `<g fill="none" stroke="${W}" stroke-width="1.2" stroke-linecap="round"><path d="M6.2 6.2c-.5 1.6-.5 3.4 0 5M11.8 6.2c.5 1.6.5 3.4 0 5"/><path d="M7.8 7.8h2.4"/></g>`,
  list_blocks: `<g stroke="${W}" stroke-width="1.15" stroke-linecap="round"><circle cx="5.6" cy="6.5" r="0.75" fill="${W}"/><circle cx="5.6" cy="9" r="0.75" fill="${W}"/><circle cx="5.6" cy="11.5" r="0.75" fill="${W}"/><path d="M8.2 6.5h4.7M8.2 9h4.7M8.2 11.5h3.8"/></g>`,
  colour_blocks: `<circle cx="7.1" cy="8.2" r="1.55" fill="${W}"/><circle cx="10.3" cy="6.8" r="1.35" fill="${W}" opacity="0.92"/><circle cx="11.2" cy="10.1" r="1.25" fill="${W}" opacity="0.88"/>`,
  variable_blocks: `<rect x="5.1" y="6.2" width="7.8" height="5.6" rx="1" fill="none" stroke="${W}" stroke-width="1.2"/><path fill="none" stroke="${W}" stroke-width="1.2" stroke-linecap="round" d="M7.4 9h3.2"/>`,
  variable_dynamic_blocks: `<g fill="none" stroke="${W}" stroke-width="1.15" stroke-linejoin="round"><rect x="5.2" y="5.85" width="7.6" height="2.55" rx="0.65"/><rect x="5.2" y="9.6" width="7.6" height="2.55" rx="0.65"/></g>`,
  procedure_blocks: `<g fill="none" stroke="${W}" stroke-width="1.2" stroke-linecap="round"><path d="M5.6 6.8c-.7 1-.7 4.4 0 5.4"/><path d="M12.4 6.8c.7 1 .7 4.4 0 5.4"/><path d="M8.1 10.6h1.8"/></g>`,
};

function categoryIconInnerForStyle(style: string): string {
  return CATEGORY_ICON_INNER[style] ?? `<circle cx="9" cy="9" r="1.75" fill="${W}"/>`;
}

/**
 * Data URL for the **toolbox sidebar** category row (circle + glyph). Not used on blocks.
 * @see toolboxCategoryIconCss
 */
export function categoryIconSrcForStyle(style: string): string {
  const hex = blockStyleColorPrimary[style] ?? FALLBACK_STYLE_COLOR;
  const inner = categoryIconInnerForStyle(style);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="${hex}"/>${inner}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
