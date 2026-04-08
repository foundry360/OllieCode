import * as Blockly from "blockly/core";
import { Blocks, FieldDropdown } from "blockly/core";
import type { Block } from "blockly/core";
import {
  costumeDropdownOptions,
  sceneDropdownOptions,
} from "@/lib/canvas/stageAssets";
import { soundDropdownOptions } from "@/lib/sounds/ollieSounds";
import { animationDropdownOptions } from "@/lib/canvas/ollieAnimationPresets";

/** Keys shown in “when … key pressed” — values match runtime in `P5Canvas`. */
export function eventKeyDropdownOptions(): [string, string][] {
  return [
    ["space", "space"],
    ["up arrow", "up"],
    ["down arrow", "down"],
    ["left arrow", "left"],
    ["right arrow", "right"],
    ["a", "a"],
    ["d", "d"],
    ["s", "s"],
    ["w", "w"],
    ["e", "e"],
    ["r", "r"],
  ];
}

export function broadcastMessageDropdownOptions(): [string, string][] {
  return [
    ["message1", "message1"],
    ["message2", "message2"],
    ["message3", "message3"],
  ];
}

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
    type: "ollie_event_key_pressed",
    message0: "when %1 key pressed",
    args0: [
      {
        type: "field_dropdown",
        name: "KEY",
        options: eventKeyDropdownOptions(),
      },
    ],
    nextStatement: true,
    style: "scratch_events",
    tooltip: "Start the stack when this key is pressed (after you tap Run).",
    helpUrl: "",
    hat: "cap",
  },
  {
    type: "ollie_event_stage_clicked",
    message0: "when stage clicked",
    nextStatement: true,
    style: "scratch_events",
    tooltip: "Start when you click the stage (after you tap Run).",
    helpUrl: "",
    hat: "cap",
  },
  {
    type: "ollie_event_backdrop_switches",
    message0: "when scene switches to %1",
    args0: [
      {
        type: "field_dropdown",
        name: "SCENE",
        options: sceneDropdownOptions(),
      },
    ],
    nextStatement: true,
    style: "scratch_events",
    tooltip: "Start when the scene matches (from the scene picker or a switch scene block).",
    helpUrl: "",
    hat: "cap",
  },
  {
    type: "ollie_event_broadcast_received",
    message0: "when I receive %1",
    args0: [
      {
        type: "field_dropdown",
        name: "MESSAGE",
        options: broadcastMessageDropdownOptions(),
      },
    ],
    nextStatement: true,
    style: "scratch_events",
    tooltip: "Start when another script broadcasts this message.",
    helpUrl: "",
    hat: "cap",
  },
  {
    type: "ollie_broadcast",
    message0: "broadcast %1",
    args0: [
      {
        type: "field_dropdown",
        name: "MESSAGE",
        options: broadcastMessageDropdownOptions(),
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_events",
    tooltip: "Tell all scripts that listen for this message to run.",
  },
  {
    type: "ollie_broadcast_and_wait",
    message0: "broadcast %1 and wait",
    args0: [
      {
        type: "field_dropdown",
        name: "MESSAGE",
        options: broadcastMessageDropdownOptions(),
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_events",
    tooltip: "Broadcast and wait until those scripts finish.",
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
    tooltip:
      "Walk in the direction the sprite is facing (uses the sprite’s walk frames while moving).",
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
    tooltip:
      "Scratch stage angles: 0° = up, 90° = right, −90° = left, 180° = down.",
  },
  {
    type: "ollie_point_towards",
    message0: "point towards %1",
    args0: [
      {
        type: "field_dropdown",
        name: "DIR",
        options: [
          ["up", "up"],
          ["right", "right"],
          ["down", "down"],
          ["left", "left"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Face the top, right, bottom, or left of the stage (same as point in direction with 0°, 90°, 180°, or −90°).",
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
    type: "ollie_say_value",
    message0: "say %1 for %2 seconds",
    args0: [
      {
        type: "input_value",
        name: "TEXT",
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
    tooltip:
      "Show a speech bubble with text from a block (variables, join, math).",
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
    type: "ollie_next_costume",
    message0: "next costume",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip:
      "Advance to the next costume frame (sprite sheet) or the next costume in the list.",
    helpUrl: "",
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
    type: "ollie_play_animation",
    message0: "play animation %1",
    args0: [
      {
        type: "field_dropdown",
        name: "ANIMATION",
        options: animationDropdownOptions(),
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip:
      "Wave (turn), walk/run (forward with a bounce stride—no extra art needed), jump (arc).",
    helpUrl: "",
  },
  {
    type: "ollie_play_sound",
    message0: "start sound %1",
    args0: [
      {
        type: "field_dropdown",
        name: "SOUND",
        options: soundDropdownOptions(),
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
        options: soundDropdownOptions(),
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
        /** Step 0.01 s so values like 0.2, 0.5, 0.75 are allowed (Blockly precision = rounding step). */
        precision: 0.01,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_control",
    tooltip: "Pause before the next block. Use decimals (e.g. 0.2, 0.5, 0.75).",
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
  {
    type: "ollie_forever",
    message0: "forever",
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
    tooltip:
      "Runs the blocks inside many times (safe cap). Nothing attaches below, like Scratch.",
  },
  {
    type: "ollie_stop",
    message0: "stop %1",
    args0: [
      {
        type: "field_dropdown",
        name: "SCOPE",
        options: [
          ["all", "ALL"],
          ["this script", "THIS"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_control",
    tooltip:
      "Stop this script or all running scripts. Blocks below this one do not run.",
  },
  {
    type: "ollie_sensing_touching",
    message0: "touching %1 ?",
    args0: [
      {
        type: "field_dropdown",
        name: "TOUCHING",
        options: [
          ["mouse-pointer", "MOUSE"],
          ["edge", "EDGE"],
        ],
      },
    ],
    output: "Boolean",
    style: "scratch_sensing",
    tooltip: "Like Scratch / mBlock — true when this sprite touches the pointer or the stage edge.",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_key_pressed",
    message0: "key %1 pressed?",
    args0: [
      {
        type: "field_dropdown",
        name: "KEY",
        options: eventKeyDropdownOptions(),
      },
    ],
    output: "Boolean",
    style: "scratch_sensing",
    tooltip: "True while this key is held (after you tap Run).",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_mouse_down",
    message0: "mouse down?",
    output: "Boolean",
    style: "scratch_sensing",
    tooltip: "True while the mouse button is pressed on the stage.",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_mouse_x",
    message0: "mouse x",
    output: "Number",
    style: "scratch_sensing",
    tooltip: "Mouse x in Scratch coordinates (−100 left to +100 right).",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_mouse_y",
    message0: "mouse y",
    output: "Number",
    style: "scratch_sensing",
    tooltip: "Mouse y in Scratch coordinates (−100 down to +100 up).",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_distance",
    message0: "distance to %1",
    args0: [
      {
        type: "field_dropdown",
        name: "TARGET",
        options: [["mouse-pointer", "MOUSE"]],
      },
    ],
    output: "Number",
    style: "scratch_sensing",
    tooltip: "Distance from the center of this sprite to the mouse in pixels.",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_timer",
    message0: "timer",
    output: "Number",
    style: "scratch_sensing",
    tooltip: "Seconds since the timer started or since “reset timer”.",
    helpUrl: "",
  },
  {
    type: "ollie_sensing_reset_timer",
    message0: "reset timer",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_sensing",
    tooltip: "Set the timer back to 0 seconds.",
    helpUrl: "",
  },
  /**
   * Same runtime as `text_prompt_ext` (number), but **message socket first** so the join
   * slot is obvious; stock Blockly puts the type dropdown first and hides the question input.
   */
  {
    type: "ollie_ask_number",
    message0: "ask %1 and wait for number",
    args0: [
      {
        type: "input_value",
        name: "TEXT",
      },
    ],
    output: "Number",
    style: "text_blocks",
    tooltip:
      "Ask a question and wait for a number answer. Put a Join block in the hole to show variables in the question.",
    helpUrl: "",
  },
  ];
}

/** Dynamic menu so new costumes in `OLLIE_SPRITE_COSTUMES` appear without stale JSON options. */
function registerOllieSwitchCostumeBlock() {
  Blocks["ollie_switch_costume"] = {
    init: function (this: Block) {
      this.setStyle("scratch_looks");
      this.appendDummyInput()
        .appendField("switch costume to")
        .appendField(
          new FieldDropdown(function (this: FieldDropdown) {
            return costumeDropdownOptions();
          }),
          "COSTUME",
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Change how the sprite looks on the stage.");
    },
  };
}

export function registerOllieBlocks() {
  Blockly.common.defineBlocksWithJsonArray(getOllieBlockDefinitions());
  registerOllieSwitchCostumeBlock();
}
