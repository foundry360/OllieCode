import * as Blockly from "blockly/core";
import {
  costumeDropdownOptions,
  sceneDropdownOptions,
} from "@/lib/canvas/stageAssets";

/**
 * Ollie blocks use Scratch 3–style `style` keys (see `ollieTheme.ts` — Motion green, Looks purple, etc.).
 */
export function getOllieBlockDefinitions(): Parameters<
  typeof Blockly.common.defineBlocksWithJsonArray
>[0] {
  return [
  {
    type: "ollie_start",
    message0: "When %1 clicked",
    args0: [
      {
        type: "field_label_serializable",
        name: "LABEL",
        text: "Run",
      },
    ],
    nextStatement: true,
    style: "scratch_events",
    tooltip: "Like Scratch’s green flag — stack blocks below, then tap Run.",
    helpUrl: "",
    hat: "cap",
  },
  {
    type: "ollie_move_forward",
    message0: "move %1 steps",
    args0: [
      {
        type: "field_number",
        name: "STEPS",
        value: 10,
        min: 0.25,
        max: 50,
        precision: 2,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip: "Move in the direction the sprite is facing.",
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
    style: "scratch_motion",
    tooltip: "Turn clockwise (positive) or counter-clockwise (negative).",
  },
  {
    type: "ollie_turn_left",
    message0: "turn left %1 degrees",
    args0: [
      {
        type: "field_number",
        name: "ANGLE",
        value: 15,
        min: 1,
        max: 180,
        precision: 0,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip: "Turn counter-clockwise (Scratch-style).",
  },
  {
    type: "ollie_turn_right",
    message0: "turn right %1 degrees",
    args0: [
      {
        type: "field_number",
        name: "ANGLE",
        value: 15,
        min: 1,
        max: 180,
        precision: 0,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip: "Turn clockwise (Scratch-style).",
  },
  {
    type: "ollie_point_in_direction",
    message0: "point in direction %1",
    args0: [
      {
        type: "field_number",
        name: "ANGLE",
        value: 90,
        min: -180,
        max: 180,
        precision: 0,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip: "0° = up, 90° = right (like Scratch stage).",
  },
  {
    type: "ollie_go_to_xy",
    message0: "go to x: %1 y: %2 (−100–100)",
    args0: [
      {
        type: "field_number",
        name: "XPCT",
        value: 0,
        min: -100,
        max: 100,
        precision: 0,
      },
      {
        type: "field_number",
        name: "YPCT",
        value: 0,
        min: -100,
        max: 100,
        precision: 0,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Scratch-style position: x is left (−100) to right (+100); y is up (+100) to down (−100). Center is 0, 0.",
  },
  {
    type: "ollie_glide_to",
    message0: "glide %1 secs to x: %2 y: %3",
    args0: [
      {
        type: "field_number",
        name: "SECS",
        value: 1,
        min: 0.1,
        max: 15,
        precision: 1,
      },
      {
        type: "field_number",
        name: "XPCT",
        value: 0,
        min: -100,
        max: 100,
        precision: 0,
      },
      {
        type: "field_number",
        name: "YPCT",
        value: 0,
        min: -100,
        max: 100,
        precision: 0,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Glide to a Scratch-style position: x left (−100) to right (+100); y up (+100) to down (−100).",
  },
  {
    type: "ollie_if_on_edge_bounce",
    message0: "if on edge, bounce",
    args0: [],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip: "If touching the edge of the stage, turn around.",
  },
  {
    type: "ollie_say",
    message0: "say %1 for %2 seconds",
    args0: [
      {
        type: "field_input",
        name: "TEXT",
        text: "Hello!",
      },
      {
        type: "field_number",
        name: "SECS",
        value: 2,
        min: 0.1,
        max: 10,
        precision: 1,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Show a speech bubble (Scratch-style).",
  },
  {
    type: "ollie_think",
    message0: "think %1 for %2 seconds",
    args0: [
      {
        type: "field_input",
        name: "TEXT",
        text: "Hmm…",
      },
      {
        type: "field_number",
        name: "SECS",
        value: 2,
        min: 0.1,
        max: 10,
        precision: 1,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Show a thought bubble.",
  },
  {
    type: "ollie_switch_costume",
    message0: "switch costume to %1",
    args0: [
      {
        type: "field_dropdown",
        name: "COSTUME",
        options: costumeDropdownOptions(),
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Change how the sprite looks on the stage.",
  },
  {
    type: "ollie_switch_scene",
    message0: "switch scene to %1",
    args0: [
      {
        type: "field_dropdown",
        name: "SCENE",
        options: sceneDropdownOptions(),
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Change the stage scene (same choices as under the canvas).",
  },
  {
    type: "ollie_play_sound",
    message0: "start sound %1",
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
    style: "scratch_sound",
    tooltip: "Play a sound (does not wait for it to finish).",
  },
  {
    type: "ollie_play_sound_until_done",
    message0: "play sound %1 until done",
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
    style: "scratch_sound",
    tooltip: "Play a sound and wait (Scratch-style).",
  },
  {
    type: "ollie_wait",
    message0: "wait %1 seconds",
    args0: [
      {
        type: "field_number",
        name: "SECS",
        value: 1,
        min: 0,
        max: 10,
        precision: 1,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_control",
    tooltip: "Pause before the next block.",
  },
  {
    type: "ollie_repeat",
    message0: "repeat %1 times",
    args0: [
      {
        type: "field_number",
        name: "TIMES",
        value: 10,
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
    style: "scratch_control",
    tooltip: "Repeat the blocks inside (like Scratch’s repeat loop).",
  },
  ];
}

export function registerOllieBlocks() {
  Blockly.common.defineBlocksWithJsonArray(getOllieBlockDefinitions());
}
