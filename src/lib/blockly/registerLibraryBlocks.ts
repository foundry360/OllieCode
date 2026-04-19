/**
 * Loads standard Blockly blocks from `blockly/blocks`, then color blocks from
 * `@blockly/field-colour` (core no longer ships those blocks or `field_colour`).
 * Call after initBlocklyLocale(), then registerOllieBlocks(), then inject().
 *
 * Library registration runs once per page: `OllieWorkspace` may remount Blockly when
 * `blocklyInjectKey` changes; re-importing would redefine blocks and spam console warnings.
 */
import { Blocks, Events, type Block } from "blockly/core";

/**
 * Stock Blockly assigns `math_change` to `variable_blocks` (orange). In Ollie we
 * surface it in the Math toolbox — use `math_blocks` so it matches other math.
 * Patch `init` instead of re-registering the block (avoids “overwrites previous definition”).
 */
function restyleMathChangeAsMathCategory(): void {
  const def = Blocks.math_change as
    | { init?: (this: Block) => void }
    | undefined;
  if (!def?.init) return;
  const origInit = def.init;
  def.init = function (this: Block) {
    origInit.call(this);
    this.setStyle("math_blocks");
  };
}

/**
 * Blockly’s `variables_set_dynamic` sets the VALUE socket to the variable’s type (e.g. Number).
 * That blocks plugging `text_join` (String) into **set [Guess] to** when Guess is a number —
 * learners must nest **ask** first, but the mismatch is confusing. Scratch-style stacks are
 * effectively untyped here; the runtime still coerces ask / math correctly.
 */
/**
 * `@blockly/field-colour` registers reporters with the library default output check.
 * After init we switch sockets to the American spelling `Color` for consistency in the UI.
 */
function patchColorReporterBlocksToColorType(): void {
  const types = [
    "colour_picker",
    "colour_random",
    "colour_rgb",
    "colour_blend",
  ] as const;
  for (const type of types) {
    const def = Blocks[type] as
      | { init?: (this: Block) => void }
      | undefined;
    if (!def?.init) continue;
    const origInit = def.init;
    def.init = function (this: Block) {
      origInit.call(this);
      this.outputConnection?.setCheck("Color");
      if (type === "colour_blend") {
        this.getInput("COLOUR1")?.connection?.setCheck("Color");
        this.getInput("COLOUR2")?.connection?.setCheck("Color");
      }
    };
  }
}

function ollieRelaxVariablesSetDynamicValueCheck(): void {
  const def = Blocks.variables_set_dynamic as
    | { init?: (this: Block) => void }
    | undefined;
  if (!def?.init) return;

  const origInit = def.init;
  def.init = function (this: Block) {
    origInit.call(this);
    const relax = () => {
      this.getInput("VALUE")?.connection?.setCheck(null);
    };
    relax();
    const previous = this.onchange as
      | ((e: Events.Abstract) => void)
      | undefined;
    this.setOnChange((e: Events.Abstract) => {
      previous?.call(this, e);
      relax();
    });
  };
}

let libraryBlocksLoadPromise: Promise<void> | null = null;

export async function loadBlocklyLibraryBlocks(): Promise<void> {
  if (!libraryBlocksLoadPromise) {
    libraryBlocksLoadPromise = (async () => {
      await import("blockly/blocks");
      const { installAllBlocks } = await import("@blockly/field-colour");
      installAllBlocks();
      patchColorReporterBlocksToColorType();
      restyleMathChangeAsMathCategory();
      ollieRelaxVariablesSetDynamicValueCheck();
    })();
  }
  await libraryBlocksLoadPromise;
}
