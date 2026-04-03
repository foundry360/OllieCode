import * as Blockly from "blockly/core";

/**
 * Ollie custom blocks — add new block JSON here, then extend executeBlocks.ts and toolbox.ts.
 * Future: block-to-block transforms, custom mutators, or Blockly plugins can plug in here.
 */
export const OLLIE_BLOCK_DEFINITIONS: Parameters<
  typeof Blockly.common.defineBlocksWithJsonArray
>[0] = [
  {
    type: "ollie_start",
    message0: "When %1",
    args0: [
      {
        type: "field_label_serializable",
        name: "LABEL",
        text: "Run",
      },
    ],
    nextStatement: true,
    colour: 72,
    tooltip: "Stack blocks below — they run when you tap Run.",
    helpUrl: "",
    hat: "cap",
  },
  {
    type: "ollie_move_forward",
    message0: "move forward %1 steps",
    args0: [
      {
        type: "field_number",
        name: "STEPS",
        value: 2,
        min: 0.25,
        max: 20,
        precision: 2,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 192,
    tooltip: "Move the sprite on the canvas.",
  },
  {
    type: "ollie_turn",
    message0: "turn %1 degrees",
    args0: [
      {
        type: "field_number",
        name: "ANGLE",
        value: 90,
        min: -360,
        max: 360,
        precision: 0,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 192,
    tooltip: "Rotate the sprite.",
  },
  {
    type: "ollie_play_sound",
    message0: "play %1 sound",
    args0: [
      {
        type: "field_dropdown",
        name: "SOUND",
        options: [
          ["pop", "pop"],
          ["boing", "boing"],
          ["cheer", "cheer"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 288,
    tooltip: "Play a fun sound (Howler.js).",
  },
  {
    type: "ollie_wait",
    message0: "wait %1 seconds",
    args0: [
      {
        type: "field_number",
        name: "SECS",
        value: 0.5,
        min: 0,
        max: 10,
        precision: 1,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 48,
    tooltip: "Pause before the next block.",
  },
  {
    type: "ollie_repeat",
    message0: "repeat %1 times",
    args0: [
      {
        type: "field_number",
        name: "TIMES",
        value: 4,
        min: 1,
        max: 50,
        precision: 0,
      },
    ],
    message1: "do %1",
    args1: [
      {
        type: "input_statement",
        name: "DO",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 132,
    tooltip: "Run the nested blocks multiple times.",
  },
];

export function registerOllieBlocks() {
  Blockly.common.defineBlocksWithJsonArray(OLLIE_BLOCK_DEFINITIONS);
}
