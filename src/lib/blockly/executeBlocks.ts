import * as Blockly from "blockly/core";
import type { OllieAction } from "@/types/ollie";

const BASE_STEP_PX = 24;

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
      case "ollie_play_sound": {
        const id = String(current.getFieldValue("SOUND"));
        if (id === "pop" || id === "boing" || id === "cheer") {
          actions.push({ type: "sound", id });
        }
        break;
      }
      case "ollie_wait": {
        const secs = Number(current.getFieldValue("SECS")) || 0;
        actions.push({ type: "wait", ms: Math.max(0, secs * 1000) });
        break;
      }
      case "ollie_repeat": {
        const times = Math.max(1, Math.floor(Number(current.getFieldValue("TIMES")) || 1));
        const inner = current.getInputTargetBlock("DO");
        for (let i = 0; i < times; i += 1) {
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
