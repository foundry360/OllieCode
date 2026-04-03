import type * as Blockly from "blockly/core";

/** Toolbox — add categories or new block types as you extend ollieBlocks.ts */
export const OLLIE_TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Start",
      colour: "72",
      contents: [{ kind: "block", type: "ollie_start" }],
    },
    {
      kind: "category",
      name: "Motion",
      colour: "192",
      contents: [
        { kind: "block", type: "ollie_move_forward" },
        { kind: "block", type: "ollie_turn" },
      ],
    },
    {
      kind: "category",
      name: "Sound",
      colour: "288",
      contents: [{ kind: "block", type: "ollie_play_sound" }],
    },
    {
      kind: "category",
      name: "Control",
      colour: "132",
      contents: [
        { kind: "block", type: "ollie_wait" },
        { kind: "block", type: "ollie_repeat" },
      ],
    },
  ],
};
