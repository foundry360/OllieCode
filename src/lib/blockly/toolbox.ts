import {
  PROCEDURE_CATEGORY_NAME,
  VARIABLE_CATEGORY_NAME,
  VARIABLE_DYNAMIC_CATEGORY_NAME,
  utils,
} from "blockly/core";
import { scratchToolboxCategoryColour } from "@/lib/blockly/ollieTheme";

const B = (type: string) => ({ kind: "block" as const, type });

/**
 * Scratch-style Ollie categories (see scratch.mit.edu Getting Started) + Blockly library blocks.
 */
export const OLLIE_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Events",
      colour: scratchToolboxCategoryColour.events,
      contents: [B("ollie_start")],
    },
    {
      kind: "category",
      name: "Motion",
      colour: scratchToolboxCategoryColour.motion,
      contents: [
        B("ollie_move_forward"),
        B("ollie_turn"),
        B("ollie_turn_left"),
        B("ollie_turn_right"),
        B("ollie_point_in_direction"),
        B("ollie_go_to_xy"),
        B("ollie_glide_to"),
        B("ollie_if_on_edge_bounce"),
      ],
    },
    {
      kind: "category",
      name: "Looks",
      colour: scratchToolboxCategoryColour.looks,
      contents: [
        B("ollie_say"),
        B("ollie_think"),
        B("ollie_switch_costume"),
        B("ollie_switch_scene"),
      ],
    },
    {
      kind: "category",
      name: "Sound",
      colour: scratchToolboxCategoryColour.sound,
      contents: [B("ollie_play_sound"), B("ollie_play_sound_until_done")],
    },
    {
      kind: "category",
      name: "Control",
      colour: scratchToolboxCategoryColour.control,
      contents: [B("ollie_wait"), B("ollie_repeat")],
    },
    {
      kind: "category",
      name: "Logic",
      colour: scratchToolboxCategoryColour.logic,
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
      colour: scratchToolboxCategoryColour.loops,
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
      name: "Math",
      colour: scratchToolboxCategoryColour.math,
      contents: [
        B("math_number"),
        B("math_arithmetic"),
        B("math_single"),
        B("math_trig"),
        B("math_constant"),
        B("math_number_property"),
        B("math_round"),
        B("math_on_list"),
        B("math_modulo"),
        B("math_constrain"),
        B("math_random_int"),
        B("math_random_float"),
        B("math_atan2"),
      ],
    },
    {
      kind: "category",
      name: "Text",
      colour: scratchToolboxCategoryColour.text,
      contents: [
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
        B("text_prompt_ext"),
      ],
    },
    {
      kind: "category",
      name: "Lists",
      colour: scratchToolboxCategoryColour.lists,
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
      colour: scratchToolboxCategoryColour.color,
      contents: [B("colour_picker"), B("colour_random"), B("colour_rgb"), B("colour_blend")],
    },
    {
      kind: "category",
      name: "Variables",
      colour: scratchToolboxCategoryColour.variables,
      custom: VARIABLE_CATEGORY_NAME,
    },
    {
      kind: "category",
      name: "Variables (dynamic)",
      colour: scratchToolboxCategoryColour.variablesDynamic,
      custom: VARIABLE_DYNAMIC_CATEGORY_NAME,
    },
    {
      kind: "category",
      name: "Functions",
      colour: scratchToolboxCategoryColour.functions,
      custom: PROCEDURE_CATEGORY_NAME,
    },
  ],
} as const satisfies utils.toolbox.ToolboxDefinition;
