import * as Blockly from "blockly/core";
import { Blocks, FieldDropdown } from "blockly/core";
import type { Block } from "blockly/core";
import { getSwitchCostumeDropdownOptions } from "@/lib/blockly/costumeDropdownRegistry";
import { getTouchingSpriteDropdownOptions } from "@/lib/blockly/spriteTouchingDropdownRegistry";
import {
  getSceneTextDropdownOptions,
  getSwitchSceneDropdownOptions,
} from "@/lib/blockly/sceneDropdownRegistry";
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
  const blocks: Parameters<typeof Blockly.common.defineBlocksWithJsonArray>[0] =
    [
  {
    type: "ollie_start",
    message0: "When %1 clicked",
    args0: [
      {
        type: "field_image",
        name: "RUN_ICON",
        src: "/images/blockly/run-play.svg",
        width: 20,
        height: 20,
        alt: "Run",
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
        type: "input_value",
        name: "STEPS",
        check: "Number",
      },
    ],
    inputsInline: true,
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
        type: "input_value",
        name: "ANGLE",
        check: "Number",
      },
    ],
    inputsInline: true,
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
        type: "input_value",
        name: "ANGLE",
        check: "Number",
      },
    ],
    inputsInline: true,
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
        type: "input_value",
        name: "ANGLE",
        check: "Number",
      },
    ],
    inputsInline: true,
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
        type: "input_value",
        name: "ANGLE",
        check: "Number",
      },
    ],
    inputsInline: true,
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
          ["mouse-pointer", "mouse"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Face the top, right, bottom, or left of the stage, or toward the mouse pointer (Scratch-style).",
  },
  {
    type: "ollie_set_point_toward_aim",
    message0: "set point offset sideways %1 %",
    args0: [
      {
        type: "input_value",
        name: "OFFPCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Sideways aim as a percent of half the costume width (−100…100): positive = a bit to the right when facing up, negative = left. Scales with the costume and size. Use with “point towards mouse-pointer”.",
  },
  {
    type: "ollie_go_to_xy",
    message0: "go to x: %1 y: %2 (−100–100)",
    args0: [
      {
        type: "input_value",
        name: "XPCT",
        check: "Number",
      },
      {
        type: "input_value",
        name: "YPCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Scratch-style position: x is left (−100) to right (+100); y is up (+100) to down (−100). Center is 0, 0. Drag a sprite on the stage, then add this block to fill in where it is.",
  },
  {
    type: "ollie_go_to_target",
    message0: "go to %1",
    args0: [
      {
        type: "field_dropdown",
        name: "TARGET",
        options: [
          ["random position", "random"],
          ["mouse-pointer", "mouse"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Jump to a random point on the stage, or to where the mouse is (Scratch-style).",
  },
  /**
   * @deprecated Old projects only — use {@link ollie_go_to_target} with “random position”.
   */
  {
    type: "ollie_go_to_random_position",
    message0: "go to random position",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip: "Use “go to …” in the toolbox instead.",
    helpUrl: "",
  },
  {
    type: "ollie_set_x_to",
    message0: "set x to %1",
    args0: [
      {
        type: "input_value",
        name: "XPCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Set horizontal position in Scratch coordinates (x: −100 to 100). Plug in mouse x, variables, or math. Keeps the current y.",
  },
  {
    type: "ollie_set_y_to",
    message0: "set y to %1",
    args0: [
      {
        type: "input_value",
        name: "YPCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Set vertical position in Scratch coordinates (y: −100 bottom to +100 top). Plug in mouse y, variables, or math. Keeps the current x.",
  },
  {
    type: "ollie_change_x_by",
    message0: "change x by %1",
    args0: [
      {
        type: "input_value",
        name: "DX",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Move horizontally in Scratch coordinates (adds to x: left −100 to right +100).",
  },
  {
    type: "ollie_change_y_by",
    message0: "change y by %1",
    args0: [
      {
        type: "input_value",
        name: "DY",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Move vertically in Scratch coordinates (adds to y: up +100 to down −100).",
  },
  {
    type: "ollie_x_position",
    message0: "x position",
    output: "Number",
    style: "scratch_motion",
    tooltip:
      "This sprite’s horizontal position in Scratch coordinates (−100 left to +100 right).",
    helpUrl: "",
  },
  {
    type: "ollie_y_position",
    message0: "y position",
    output: "Number",
    style: "scratch_motion",
    tooltip:
      "This sprite’s vertical position in Scratch coordinates (−100 bottom to +100 top).",
    helpUrl: "",
  },
  {
    type: "ollie_glide_to",
    message0: "glide %1 secs to x: %2 y: %3",
    args0: [
      {
        type: "input_value",
        name: "SECS",
        check: "Number",
      },
      {
        type: "input_value",
        name: "XPCT",
        check: "Number",
      },
      {
        type: "input_value",
        name: "YPCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_motion",
    tooltip:
      "Glide to a Scratch-style position: x left (−100) to right (+100); y up (+100) to down (−100). Seconds can be decimals (e.g. 0.2, 1.5).",
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
        type: "input_value",
        name: "SECS",
        check: "Number",
      },
    ],
    inputsInline: true,
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
        type: "input_value",
        name: "SECS",
        check: "Number",
      },
    ],
    inputsInline: true,
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
        type: "input_value",
        name: "SECS",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Show a thought bubble.",
  },
  {
    type: "ollie_grow_size",
    message0: "grow by %1 %",
    args0: [
      {
        type: "input_value",
        name: "PCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip:
      "Make this sprite larger. Size starts at 100% (like Scratch); each block adds to that percent.",
    helpUrl: "",
  },
  {
    type: "ollie_shrink_size",
    message0: "shrink by %1 %",
    args0: [
      {
        type: "input_value",
        name: "PCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Make this sprite smaller (reduces size % from 100%).",
    helpUrl: "",
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
    type: "ollie_show",
    message0: "show",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Show this sprite on the stage.",
    helpUrl: "",
  },
  {
    type: "ollie_hide",
    message0: "hide",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Hide this sprite (still runs scripts; use Show to appear again).",
    helpUrl: "",
  },
  {
    type: "ollie_go_to_layer",
    message0: "go to %1 layer",
    args0: [
      {
        type: "input_value",
        name: "LAYER",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip:
      "Move this sprite in the stack: 1 is behind everyone, higher numbers move toward the front. Same order as the sprite list below the stage.",
    helpUrl: "",
  },
  {
    type: "ollie_change_size_by",
    message0: "change size by %1 %",
    args0: [
      {
        type: "input_value",
        name: "DELTA",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip:
      "Add to the current size percent (positive grows, negative shrinks; same as Scratch).",
    helpUrl: "",
  },
  {
    type: "ollie_set_size_to",
    message0: "set size to %1 %",
    args0: [
      {
        type: "input_value",
        name: "PCT",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Set display size to a percent (100 = normal).",
    helpUrl: "",
  },
  {
    type: "ollie_next_scene",
    message0: "next scene",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_looks",
    tooltip: "Switch to the next backdrop in the list (wraps to the first).",
    helpUrl: "",
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
        type: "input_value",
        name: "SECS",
        check: "Number",
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    style: "scratch_control",
    tooltip: "Pause before the next block. Use decimals (e.g. 0.2, 0.5, 0.75).",
  },
  {
    type: "ollie_wait_until",
    message0: "wait until %1",
    args0: [
      {
        type: "input_value",
        name: "BOOL",
        check: "Boolean",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: "scratch_control",
    tooltip:
      "Pause this script until the condition is true. Use Sensing + Logic blocks (e.g. key pressed, touching mouse-pointer).",
  },
  {
    type: "ollie_repeat",
    message0: "repeat %1 times",
    args0: [
      {
        type: "input_value",
        name: "TIMES",
        check: "Number",
      },
    ],
    inputsInline: true,
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
    type: "ollie_delete_this_clone",
    message0: "delete this clone",
    previousStatement: null,
    nextStatement: null,
    style: "scratch_control",
    tooltip:
      "Remove this clone from the stage (only affects clones). On the main sprite, does nothing.",
  },
  {
    type: "ollie_clone_start",
    message0: "when I start as a clone",
    nextStatement: true,
    style: "scratch_control",
    tooltip:
      "When this sprite is created with “create clone of myself”, the blocks below run for that new copy.",
    hat: "cap",
  },
  {
    type: "ollie_create_clone",
    message0: "create clone of myself",
    previousStatement: null,
    nextStatement: true,
    style: "scratch_control",
    tooltip:
      "Makes another copy of this sprite on the stage and runs “when I start as a clone” for it.",
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
    type: "ollie_sensing_is_clone",
    message0: "is a clone?",
    output: "Boolean",
    style: "scratch_sensing",
    tooltip:
      "True for a sprite that was created with “create clone of myself”; false for the main sprite.",
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
  {
    type: "ollie_pick_random",
    message0: "pick random %1 to %2",
    args0: [
      {
        type: "input_value",
        name: "FROM",
        check: "Number",
      },
      {
        type: "input_value",
        name: "TO",
        check: "Number",
      },
    ],
    inputsInline: true,
    output: "Number",
    style: "math_blocks",
    tooltip:
      "Whole number from the first value through the second (inclusive), like Scratch. Bounds can be variables or math.",
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
  return blocks;
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
            return getSwitchCostumeDropdownOptions();
          }),
          "COSTUME",
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip(
        "Pick a library costume, or under the line, a My Sprite from this project.",
      );
    },
  };
}

function registerOllieSensingTouchingBlock() {
  Blocks["ollie_sensing_touching"] = {
    init: function (this: Block) {
      this.setStyle("scratch_sensing");
      this.appendDummyInput()
        .appendField("touching")
        .appendField(
          new FieldDropdown(function (this: FieldDropdown) {
            return getTouchingSpriteDropdownOptions();
          }),
          "TOUCHING",
        )
        .appendField("?");
      this.setOutput(true, "Boolean");
      this.setTooltip(
        "True when this sprite overlaps the pointer, the stage edge, or another sprite from this project.",
      );
      this.setHelpUrl("");
    },
  };
}

function registerOllieEventBackdropSwitchesBlock() {
  Blocks["ollie_event_backdrop_switches"] = {
    init: function (this: Block) {
      this.setStyle("scratch_events");
      this.appendDummyInput()
        .appendField("when scene switches to")
        .appendField(
          new FieldDropdown(function (this: FieldDropdown) {
            return getSceneTextDropdownOptions();
          }),
          "SCENE",
        );
      this.setNextStatement(true, null);
      this.setTooltip(
        "Start when the scene matches (from the scene picker or a switch scene block).",
      );
      this.setHelpUrl("");
      (this as unknown as { setHat?: (h: string) => void }).setHat?.("cap");
    },
  };
}

function registerOllieSwitchSceneBlock() {
  Blocks["ollie_switch_scene"] = {
    init: function (this: Block) {
      this.setStyle("scratch_looks");
      this.appendDummyInput()
        .appendField("switch scene to")
        .appendField(
          new FieldDropdown(function (this: FieldDropdown) {
            return getSwitchSceneDropdownOptions();
          }),
          "SCENE",
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Change the stage scene (same choices as under the canvas).");
    },
  };
}

function registerOllieSetSpeechBubbleColorBlock() {
  Blocks["ollie_set_speech_bubble_color"] = {
    init: function (this: Block) {
      this.setStyle("scratch_looks");
      this.appendDummyInput().appendField("set speech bubble color to");
      this.appendValueInput("COLOR").setCheck("Color");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip(
        "Sets the fill color for say and think bubbles (use Color blocks). Default is white.",
      );
    },
  };
}

export function registerOllieBlocks() {
  Blockly.common.defineBlocksWithJsonArray(getOllieBlockDefinitions());
  registerOllieEventBackdropSwitchesBlock();
  registerOllieSwitchCostumeBlock();
  registerOllieSensingTouchingBlock();
  registerOllieSwitchSceneBlock();
  registerOllieSetSpeechBubbleColorBlock();
}
