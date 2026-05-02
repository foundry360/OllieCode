import { PROCEDURE_CATEGORY_NAME, VARIABLE_CATEGORY_NAME, utils } from "blockly/core";
import { scratchToolboxCategoryColor } from "@/lib/blockly/ollieTheme";
import { ollieToolboxCategoryCssconfig } from "@/lib/blockly/toolboxCategoryIconCss";

const B = (type: string) => ({ kind: "block" as const, type });

type NumberShadowInputs = Record<
  string,
  { shadow: { type: string; fields: { NUM: number } } }
>;

/** Default `math_number` shadows for one or more Number sockets (e.g. mouse x, variables). */
function blockWithNumberShadows(
  type: string,
  shadows: Record<string, number>,
): ReturnType<typeof B> & { inputs: NumberShadowInputs } {
  const inputs: NumberShadowInputs = {};
  for (const [name, num] of Object.entries(shadows)) {
    inputs[name] = {
      shadow: { type: "math_number", fields: { NUM: num } },
    };
  }
  return { kind: "block", type, inputs };
}

function blockWithNumberShadow(
  type: string,
  inputName: string,
  shadowNum = 0,
): ReturnType<typeof B> & { inputs: NumberShadowInputs } {
  return blockWithNumberShadows(type, { [inputName]: shadowNum });
}

/**
 * Scratch-style Ollie categories (see scratch.mit.edu Getting Started) + Blockly library blocks.
 */
export const OLLIE_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Events",
      colour: scratchToolboxCategoryColor.events,
      cssconfig: ollieToolboxCategoryCssconfig("events"),
      contents: [
        B("ollie_start"),
        B("ollie_event_key_pressed"),
        B("ollie_event_stage_clicked"),
        B("ollie_event_backdrop_switches"),
        B("ollie_event_broadcast_received"),
        B("ollie_broadcast"),
        B("ollie_broadcast_and_wait"),
      ],
    },
    {
      kind: "category",
      name: "Motion",
      colour: scratchToolboxCategoryColor.motion,
      cssconfig: ollieToolboxCategoryCssconfig("motion"),
      contents: [
        blockWithNumberShadow("ollie_move_forward", "STEPS", 10),
        blockWithNumberShadow("ollie_turn", "ANGLE", 90),
        blockWithNumberShadow("ollie_turn_left", "ANGLE", 15),
        blockWithNumberShadow("ollie_turn_right", "ANGLE", 15),
        blockWithNumberShadow("ollie_point_in_direction", "ANGLE", 90),
        B("ollie_point_towards"),
        blockWithNumberShadow("ollie_set_point_toward_aim", "OFFPCT", 0),
        blockWithNumberShadows("ollie_go_to_xy", { XPCT: 0, YPCT: 0 }),
        B("ollie_go_to_target"),
        blockWithNumberShadow("ollie_set_x_to", "XPCT", 0),
        blockWithNumberShadow("ollie_set_y_to", "YPCT", 0),
        blockWithNumberShadow("ollie_change_x_by", "DX", 10),
        blockWithNumberShadow("ollie_change_y_by", "DY", 10),
        B("ollie_x_position"),
        B("ollie_y_position"),
        blockWithNumberShadows("ollie_glide_to", {
          SECS: 1,
          XPCT: 0,
          YPCT: 0,
        }),
        B("ollie_if_on_edge_bounce"),
      ],
    },
    {
      kind: "category",
      name: "Looks",
      colour: scratchToolboxCategoryColor.looks,
      cssconfig: ollieToolboxCategoryCssconfig("looks"),
      contents: [
        blockWithNumberShadow("ollie_say", "SECS", 2),
        blockWithNumberShadow("ollie_say_value", "SECS", 2),
        blockWithNumberShadow("ollie_think", "SECS", 2),
        B("ollie_set_speech_bubble_color"),
        B("ollie_switch_costume"),
        B("ollie_next_costume"),
        B("ollie_show"),
        B("ollie_hide"),
        blockWithNumberShadow("ollie_grow_size", "PCT", 10),
        blockWithNumberShadow("ollie_shrink_size", "PCT", 10),
        blockWithNumberShadow("ollie_change_size_by", "DELTA", 10),
        blockWithNumberShadow("ollie_set_size_to", "PCT", 100),
        B("ollie_switch_scene"),
        B("ollie_next_scene"),
        B("ollie_play_animation"),
      ],
    },
    {
      kind: "category",
      name: "Sound",
      colour: scratchToolboxCategoryColor.sound,
      cssconfig: ollieToolboxCategoryCssconfig("sound"),
      contents: [B("ollie_play_sound"), B("ollie_play_sound_until_done")],
    },
    {
      kind: "category",
      name: "Sensing",
      colour: scratchToolboxCategoryColor.sensing,
      cssconfig: ollieToolboxCategoryCssconfig("sensing"),
      contents: [
        B("ollie_sensing_touching"),
        B("ollie_sensing_key_pressed"),
        B("ollie_sensing_mouse_down"),
        B("ollie_sensing_is_clone"),
        B("ollie_sensing_mouse_x"),
        B("ollie_sensing_mouse_y"),
        B("ollie_sensing_distance"),
        B("ollie_sensing_timer"),
        B("ollie_sensing_reset_timer"),
      ],
    },
    {
      kind: "category",
      name: "Control",
      colour: scratchToolboxCategoryColor.control,
      cssconfig: ollieToolboxCategoryCssconfig("control"),
      contents: [
        blockWithNumberShadow("ollie_wait", "SECS", 1),
        B("ollie_wait_until"),
        blockWithNumberShadow("ollie_repeat", "TIMES", 10),
        B("ollie_forever"),
        B("controls_whileUntil"),
        B("controls_repeat_ext"),
        B("ollie_stop"),
        B("ollie_clone_start"),
        B("ollie_create_clone"),
        B("ollie_delete_this_clone"),
      ],
    },
    {
      kind: "category",
      name: "Logic",
      colour: scratchToolboxCategoryColor.logic,
      cssconfig: ollieToolboxCategoryCssconfig("logic"),
      contents: [
        B("controls_if"),
        B("controls_ifelse"),
        B("logic_compare"),
        B("logic_operation"),
        B("logic_negate"),
        B("logic_boolean"),
        B("logic_null"),
        B("logic_ternary"),
      ],
    },
    {
      kind: "category",
      name: "Loops",
      colour: scratchToolboxCategoryColor.loops,
      cssconfig: ollieToolboxCategoryCssconfig("loops"),
      contents: [
        B("controls_repeat_ext"),
        B("controls_whileUntil"),
        B("controls_for"),
        B("controls_forEach"),
        B("controls_flow_statements"),
      ],
    },
    {
      kind: "category",
      name: "Numbers",
      colour: scratchToolboxCategoryColor.math,
      cssconfig: ollieToolboxCategoryCssconfig("math"),
      contents: [
        blockWithNumberShadows("ollie_pick_random", { FROM: 1, TO: 10 }),
        B("math_number"),
        B("math_arithmetic"),
        B("math_single"),
        B("math_trig"),
        B("math_constant"),
        B("math_number_property"),
        B("math_round"),
        B("math_on_list"),
        B("math_modulo"),
        B("math_change"),
        B("math_constrain"),
        B("math_random_int"),
        B("math_random_float"),
        B("math_atan2"),
      ],
    },
    {
      kind: "category",
      name: "Text",
      colour: scratchToolboxCategoryColor.text,
      cssconfig: ollieToolboxCategoryCssconfig("text"),
      contents: [
        B("ollie_ask_number"),
        B("text"),
        B("text_join"),
        B("text_append"),
        B("text_length"),
        B("text_isEmpty"),
        B("text_indexOf"),
        B("text_charAt"),
        B("text_getSubstring"),
        B("text_changeCase"),
        B("text_trim"),
        B("text_print"),
        /** Only the `_ext` ask block has a value socket; `text_prompt` uses quoted text with no connection. */
        B("text_prompt_ext"),
      ],
    },
    {
      kind: "category",
      name: "Lists",
      colour: scratchToolboxCategoryColor.lists,
      cssconfig: ollieToolboxCategoryCssconfig("lists"),
      contents: [
        B("lists_create_with"),
        B("lists_repeat"),
        B("lists_length"),
        B("lists_isEmpty"),
        B("lists_indexOf"),
        B("lists_getIndex"),
        B("lists_setIndex"),
        B("lists_getSublist"),
        B("lists_split"),
        B("lists_sort"),
      ],
    },
    {
      kind: "category",
      name: "Color",
      colour: scratchToolboxCategoryColor.color,
      cssconfig: ollieToolboxCategoryCssconfig("color"),
      contents: [B("colour_picker"), B("colour_random"), B("colour_rgb"), B("colour_blend")],
    },
    {
      kind: "category",
      name: "Variables",
      colour: scratchToolboxCategoryColor.variables,
      cssconfig: ollieToolboxCategoryCssconfig("variables"),
      custom: VARIABLE_CATEGORY_NAME,
    },
    {
      kind: "category",
      name: "Functions",
      colour: scratchToolboxCategoryColor.functions,
      cssconfig: ollieToolboxCategoryCssconfig("functions"),
      custom: PROCEDURE_CATEGORY_NAME,
    },
  ],
} as const satisfies utils.toolbox.ToolboxDefinition;
