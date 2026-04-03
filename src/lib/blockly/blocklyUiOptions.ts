/**
 * Scrollbar visuals around the Blockly toolbox / flyout are a frequent source of
 * “stuck” bars after the flyout closes (separate SVG layers + native overflow).
 *
 * Flip these to `false` if you want default Blockly/browser scrollbars back.
 *
 * - **Flyout**: Wheel and trackpad still scroll the flyout; only the SVG thumb/track is hidden.
 * - **Toolbox**: The category list still scrolls with wheel/trackpad; only the native bar is hidden.
 * - **Main workspace** (optional): If the stray strip is on the **right edge of the block canvas**,
 *   set this to `true`. The workspace still scrolls with wheel / trackpad / drag-to-pan if enabled.
 */
export const HIDE_FLYOUT_SCROLLBAR_VISUAL = true;
export const HIDE_TOOLBOX_SCROLLBAR_VISUAL = true;
export const HIDE_MAIN_WORKSPACE_SCROLLBAR_VISUAL = false;
