import * as Blockly from "blockly/core";
import type { OllieAction, OllieCostume } from "@/types/ollie";

/**
 * Run only interprets blocks chained under `ollie_start` (Ollie canvas actions).
 * Standard Blockly blocks are available for building logic; use code generation later to execute them.
 */

const BASE_STEP_PX = 2.4;

/** Prevents Run from freezing the tab on huge repeats or long scripts. */
const MAX_OLLIE_ACTIONS = 8_000;
const MAX_REPEAT_UNROLL = 2_000;

function isSoundId(s: string): s is "pop" | "boing" | "cheer" {
  return s === "pop" || s === "boing" || s === "cheer";
}

function isCostumeId(s: string): s is OllieCostume {
  return s === "cat" || s === "square" || s === "ball";
}

function walkStatementChain(
  block: Blockly.Block | null,
  actions: OllieAction[],
): void {
  let current: Blockly.Block | null = block;
  while (current) {
    switch (current.type) {
      case "ollie_move_forward": {
        const steps = Number(current.getFieldValue("STEPS")) || 0;
        actions.push({ type: "move", distance: steps * BASE_STEP_PX });
        break;
      }
      case "ollie_turn": {
        const angle = Number(current.getFieldValue("ANGLE")) || 0;
        actions.push({ type: "rotate", degrees: angle });
        break;
      }
      case "ollie_turn_left": {
        const angle = Number(current.getFieldValue("ANGLE")) || 15;
        actions.push({ type: "rotate", degrees: -Math.abs(angle) });
        break;
      }
      case "ollie_turn_right": {
        const angle = Number(current.getFieldValue("ANGLE")) || 15;
        actions.push({ type: "rotate", degrees: Math.abs(angle) });
        break;
      }
      case "ollie_point_in_direction": {
        const angle = Number(current.getFieldValue("ANGLE")) || 0;
        actions.push({ type: "setHeading", degrees: angle });
        break;
      }
      case "ollie_go_to_xy": {
        const x = Number(current.getFieldValue("XPCT")) ?? 50;
        const y = Number(current.getFieldValue("YPCT")) ?? 50;
        actions.push({
          type: "goTo",
          xPct: Math.min(100, Math.max(0, x)),
          yPct: Math.min(100, Math.max(0, y)),
        });
        break;
      }
      case "ollie_glide_to": {
        const secs = Number(current.getFieldValue("SECS")) || 1;
        const x = Number(current.getFieldValue("XPCT")) ?? 50;
        const y = Number(current.getFieldValue("YPCT")) ?? 50;
        actions.push({
          type: "glideTo",
          secs: Math.min(15, Math.max(0.1, secs)),
          xPct: Math.min(100, Math.max(0, x)),
          yPct: Math.min(100, Math.max(0, y)),
        });
        break;
      }
      case "ollie_if_on_edge_bounce":
        actions.push({ type: "bounceEdge" });
        break;
      case "ollie_say": {
        const text = String(current.getFieldValue("TEXT") ?? "");
        const secs = Number(current.getFieldValue("SECS")) || 2;
        actions.push({
          type: "say",
          text: text.slice(0, 120),
          ms: Math.max(100, secs * 1000),
        });
        break;
      }
      case "ollie_think": {
        const text = String(current.getFieldValue("TEXT") ?? "");
        const secs = Number(current.getFieldValue("SECS")) || 2;
        actions.push({
          type: "think",
          text: text.slice(0, 120),
          ms: Math.max(100, secs * 1000),
        });
        break;
      }
      case "ollie_switch_costume": {
        const id = String(current.getFieldValue("COSTUME"));
        if (isCostumeId(id)) actions.push({ type: "costume", id });
        break;
      }
      case "ollie_play_sound": {
        const id = String(current.getFieldValue("SOUND"));
        if (isSoundId(id)) actions.push({ type: "sound", id });
        break;
      }
      case "ollie_play_sound_until_done": {
        const id = String(current.getFieldValue("SOUND"));
        if (isSoundId(id)) {
          actions.push({
            type: "soundWait",
            id,
            ms: 900,
          });
        }
        break;
      }
      case "ollie_wait": {
        const secs = Number(current.getFieldValue("SECS")) || 0;
        actions.push({ type: "wait", ms: Math.max(0, secs * 1000) });
        break;
      }
      case "ollie_repeat": {
        const raw = Math.floor(Number(current.getFieldValue("TIMES")) || 1);
        const times = Math.min(
          MAX_REPEAT_UNROLL,
          Math.max(1, raw),
        );
        const inner = current.getInputTargetBlock("DO");
        for (let i = 0; i < times; i += 1) {
          if (actions.length >= MAX_OLLIE_ACTIONS) return;
          walkStatementChain(inner, actions);
        }
        break;
      }
      default:
        break;
    }
    current = current.getNextBlock();
  }
}

/**
 * Walk the workspace from the `ollie_start` block and collect canvas + sound actions.
 */
export function executeWorkspace(workspace: Blockly.Workspace): OllieAction[] {
  const actions: OllieAction[] = [];
  const tops = workspace.getTopBlocks(true);
  const start = tops.find((b) => b.type === "ollie_start");
  if (!start) return actions;

  walkStatementChain(start.getNextBlock(), actions);
  return actions;
}
