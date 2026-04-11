/**
 * Loads standard Blockly blocks from `blockly/blocks`, then color blocks from
 * `@blockly/field-colour` (core no longer ships those blocks or `field_colour`).
 * Call after initBlocklyLocale(), then registerOllieBlocks(), then inject().
 */
import { Blocks, common, Events, type Block } from "blockly/core";
/**
 * Stock Blockly assigns `math_change` to `variable_blocks` (orange). In Ollie we
 * surface it in the Math toolbox — use `math_blocks` so it matches other math.
 */
function redefineMathChangeAsMathStyle(): void {
  common.defineBlocksWithJsonArray([
    {
      type: "math_change",
      message0: "%{BKY_MATH_CHANGE_TITLE}",
      args0: [
        {
          type: "field_variable",
          name: "VAR",
          variable: "%{BKY_MATH_CHANGE_TITLE_ITEM}",
        },
        {
          type: "input_value",
          name: "DELTA",
          check: "Number",
        },
      ],
      previousStatement: null,
      nextStatement: null,
      style: "math_blocks",
      helpUrl: "%{BKY_MATH_CHANGE_HELPURL}",
      extensions: ["math_change_tooltip"],
    },
  ]);
}

/**
 * Blockly’s `variables_set_dynamic` sets the VALUE socket to the variable’s type (e.g. Number).
 * That blocks plugging `text_join` (String) into **set [Guess] to** when Guess is a number —
 * learners must nest **ask** first, but the mismatch is confusing. Scratch-style stacks are
 * effectively untyped here; the runtime still coerces ask / math correctly.
 */
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

export async function loadBlocklyLibraryBlocks(): Promise<void> {
  await import("blockly/blocks");
  const { installAllBlocks } = await import("@blockly/field-colour");
  installAllBlocks();
  redefineMathChangeAsMathStyle();
  ollieRelaxVariablesSetDynamicValueCheck();
}
