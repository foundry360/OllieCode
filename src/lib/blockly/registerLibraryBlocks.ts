/**
 * Loads standard Blockly blocks from `blockly/blocks`, then color blocks from
 * `@blockly/field-colour` (core no longer ships those blocks or `field_colour`).
 * Call after initBlocklyLocale(), then registerOllieBlocks(), then inject().
 */
export async function loadBlocklyLibraryBlocks(): Promise<void> {
  await import("blockly/blocks");
  const { installAllBlocks } = await import("@blockly/field-colour");
  installAllBlocks();
}
