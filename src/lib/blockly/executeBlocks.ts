import * as Blockly from "blockly/core";
import { serialization } from "blockly/core";
import {
  isOllieSceneId,
  isOllieSpriteCostumeId,
} from "@/lib/canvas/stageAssets";
import type { OllieAction, SpriteScriptPlan } from "@/types/ollie";

/**
 * Interprets Ollie stack blocks (Motion / Looks / Sound / Control / Events).
 * Logic/Math blocks are for structure only unless expanded later.
 */

const BASE_STEP_PX = 2.4;

/** Prevents Run from freezing the tab on huge repeats or long scripts. */
const MAX_OLLIE_ACTIONS = 8_000;
const MAX_REPEAT_UNROLL = 2_000;

function isSoundId(s: string): s is "pop" | "boing" | "cheer" {
  return s === "pop" || s === "boing" || s === "cheer";
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
        const x = Number(current.getFieldValue("XPCT")) ?? 0;
        const y = Number(current.getFieldValue("YPCT")) ?? 0;
        actions.push({
          type: "goTo",
          xPct: Math.min(100, Math.max(-100, x)),
          yPct: Math.min(100, Math.max(-100, y)),
        });
        break;
      }
      case "ollie_glide_to": {
        const secs = Number(current.getFieldValue("SECS")) || 1;
        const x = Number(current.getFieldValue("XPCT")) ?? 0;
        const y = Number(current.getFieldValue("YPCT")) ?? 0;
        actions.push({
          type: "glideTo",
          secs: Math.min(15, Math.max(0.1, secs)),
          xPct: Math.min(100, Math.max(-100, x)),
          yPct: Math.min(100, Math.max(-100, y)),
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
        if (isOllieSpriteCostumeId(id)) actions.push({ type: "costume", id });
        break;
      }
      case "ollie_switch_scene": {
        const id = String(current.getFieldValue("SCENE"));
        if (isOllieSceneId(id)) actions.push({ type: "scene", id });
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
      case "ollie_broadcast": {
        const msg = String(current.getFieldValue("MESSAGE") ?? "message1");
        actions.push({ type: "broadcast", message: msg });
        break;
      }
      case "ollie_broadcast_and_wait": {
        const msg = String(current.getFieldValue("MESSAGE") ?? "message1");
        actions.push({ type: "broadcastWait", message: msg });
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

function collectChainActions(start: Blockly.Block | null): OllieAction[] {
  const actions: OllieAction[] = [];
  walkStatementChain(start, actions);
  return actions;
}

function emptyPlan(): SpriteScriptPlan {
  return {
    runScripts: [],
    keyScripts: [],
    stageClickScripts: [],
    backdropScripts: [],
    broadcastScripts: [],
  };
}

/**
 * All event hat types that start a script stack.
 */
const HAT_TYPES = new Set([
  "ollie_start",
  "ollie_event_key_pressed",
  "ollie_event_stage_clicked",
  "ollie_event_backdrop_switches",
  "ollie_event_broadcast_received",
]);

/**
 * Compile one sprite workspace into separate scripts (multiple hats, Scratch-style).
 */
export function extractSpriteScriptPlan(
  workspace: Blockly.Workspace,
): SpriteScriptPlan {
  const plan = emptyPlan();
  const tops = workspace.getTopBlocks(true);

  for (const block of tops) {
    if (!HAT_TYPES.has(block.type)) continue;

    const chain = collectChainActions(block.getNextBlock());

    switch (block.type) {
      case "ollie_start":
        plan.runScripts.push(chain);
        break;
      case "ollie_event_key_pressed": {
        const keyId = String(block.getFieldValue("KEY") ?? "space");
        plan.keyScripts.push({ keyId, actions: chain });
        break;
      }
      case "ollie_event_stage_clicked":
        plan.stageClickScripts.push(chain);
        break;
      case "ollie_event_backdrop_switches": {
        const sid = String(block.getFieldValue("SCENE") ?? "");
        if (isOllieSceneId(sid)) {
          plan.backdropScripts.push({ sceneId: sid, actions: chain });
        }
        break;
      }
      case "ollie_event_broadcast_received": {
        const msg = String(block.getFieldValue("MESSAGE") ?? "message1");
        plan.broadcastScripts.push({ message: msg, actions: chain });
        break;
      }
      default:
        break;
    }
  }

  return plan;
}

export function extractSpriteScriptPlanFromSave(
  state: Record<string, unknown>,
): SpriteScriptPlan {
  const temp = new Blockly.Workspace();
  try {
    serialization.workspaces.load(state, temp);
    return extractSpriteScriptPlan(temp);
  } finally {
    temp.dispose();
  }
}

/**
 * @deprecated Prefer {@link extractSpriteScriptPlan} — kept for any legacy callers.
 * Returns only the first “when Run clicked” chain.
 */
export function executeWorkspace(workspace: Blockly.Workspace): OllieAction[] {
  const plan = extractSpriteScriptPlan(workspace);
  return plan.runScripts[0] ?? [];
}

/**
 * @deprecated Prefer {@link extractSpriteScriptPlanFromSave}.
 */
export function executeWorkspaceFromSave(
  state: Record<string, unknown>,
): OllieAction[] {
  const plan = extractSpriteScriptPlanFromSave(state);
  return plan.runScripts[0] ?? [];
}
