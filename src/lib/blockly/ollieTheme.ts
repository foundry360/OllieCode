import { Theme, Themes } from "blockly/core";

/**
 * Scratch 3–style saturated block colors (MIT Scratch palette).
 * @see https://en.scratch-wiki.info/wiki/Block_Colors — Motion, Looks, Sound, Events, Control, etc.
 */

function triad(primary: string, shadow: string, highlight: string) {
  return {
    colourPrimary: primary,
    colourSecondary: shadow,
    colourTertiary: highlight,
  };
}

/** Scratch 3 hex approximations — bright faces, darker edge, light top shine */
const S = {
  motion: triad("#4C97FF", "#3373CC", "#7FB8FF"),
  looks: triad("#9966FF", "#7742CC", "#B899FF"),
  sound: triad("#CF63CF", "#A84AA8", "#E88AE8"),
  events: triad("#FFBF00", "#CC9900", "#FFD54F"),
  control: triad("#FFAB19", "#CC8914", "#FFC56E"),
  sensing: triad("#5CB1D6", "#3A8FB8", "#8ECDE8"),
  operators: triad("#59C059", "#3D8F3D", "#85D685"),
  variables: triad("#FF8C1A", "#CC7015", "#FFB04D"),
  list: triad("#FF661A", "#CC5215", "#FF944D"),
  myBlocks: triad("#FF6680", "#CC5266", "#FF99A8"),
  color: triad("#FFBF00", "#CC9900", "#FFE066"),
};

/**
 * Left-strip indicator color for each toolbox row — Blockly `colour` accepts hex;
 * these match `blockStyles` primary faces so the list matches block colors.
 */
export const scratchToolboxCategoryColor = {
  events: S.events.colourPrimary,
  motion: S.operators.colourPrimary,
  looks: S.looks.colourPrimary,
  sound: S.sound.colourPrimary,
  control: S.control.colourPrimary,
  logic: S.motion.colourPrimary,
  loops: S.control.colourPrimary,
  math: S.sensing.colourPrimary,
  sensing: S.sensing.colourPrimary,
  text: S.looks.colourPrimary,
  lists: S.list.colourPrimary,
  color: S.color.colourPrimary,
  variables: S.variables.colourPrimary,
  variablesDynamic: S.variables.colourPrimary,
  functions: S.myBlocks.colourPrimary,
} as const;

/**
 * Zelos theme with Scratch-bright colors for library blocks + Ollie `scratch_*` styles.
 */
export const ollieBlocklyTheme = Theme.defineTheme("ollie", {
  name: "ollie",
  base: Themes.Zelos,
  blockStyles: {
    scratch_events: S.events,
    scratch_motion: S.operators,
    scratch_looks: S.looks,
    scratch_sound: S.sound,
    scratch_control: S.control,
    scratch_sensing: S.sensing,

    logic_blocks: S.motion,
    loop_blocks: S.control,
    math_blocks: S.sensing,
    text_blocks: S.looks,
    list_blocks: S.list,
    colour_blocks: S.color,
    variable_blocks: S.variables,
    variable_dynamic_blocks: S.variables,
    procedure_blocks: S.myBlocks,
  },
  componentStyles: {
    workspaceBackgroundColour: "#E9F1FB",
    toolboxBackgroundColour: "#FFFFFF",
    flyoutBackgroundColour: "#FFFFFF",
    flyoutOpacity: 1,
    toolboxForegroundColour: "#575E75",
    flyoutForegroundColour: "#575E75",
    scrollbarColour: "#cbd5e1",
    scrollbarOpacity: 0.95,
  },
});

/** Primary face color per block `style` — used for category strip icons on blocks. */
export const blockStyleColorPrimary: Readonly<Record<string, string>> = {
  scratch_events: S.events.colourPrimary,
  scratch_motion: S.operators.colourPrimary,
  scratch_looks: S.looks.colourPrimary,
  scratch_sound: S.sound.colourPrimary,
  scratch_control: S.control.colourPrimary,
  scratch_sensing: S.sensing.colourPrimary,
  logic_blocks: S.motion.colourPrimary,
  loop_blocks: S.control.colourPrimary,
  math_blocks: S.sensing.colourPrimary,
  text_blocks: S.looks.colourPrimary,
  list_blocks: S.list.colourPrimary,
  colour_blocks: S.color.colourPrimary,
  variable_blocks: S.variables.colourPrimary,
  variable_dynamic_blocks: S.variables.colourPrimary,
  procedure_blocks: S.myBlocks.colourPrimary,
};
