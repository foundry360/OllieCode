import * as Blockly from "blockly/core";
import { serialization } from "blockly/core";
import {
  isOllieSceneId,
  resolveCostumeFieldForExecution,
} from "@/lib/canvas/stageAssets";
import {
  evaluateBoolean,
  evaluateNumber,
} from "@/lib/blockly/evaluateBlock";
import { serializeBoolExpr } from "@/lib/blockly/sensingSerialize";
import { getAnimationPresetActions } from "@/lib/canvas/ollieAnimationPresets";
import type {
  OllieAction,
  SerializedBoolExpr,
  SpriteScriptPlan,
} from "@/types/ollie";

/**
 * Interprets Ollie stack blocks (Motion / Looks / Sound / Control / Events).
 * Logic/Math blocks are for structure only unless expanded later.
 */

const BASE_STEP_PX = 2.4;

/** Prevents Run from freezing the tab on huge repeats or long scripts. */
const MAX_OLLIE_ACTIONS = 8_000;
const MAX_REPEAT_UNROLL = 2_000;
const MAX_WHILE_UNROLL = 2_000;
const MAX_FOREVER_UNROLL = 500;

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
        const distance = steps * BASE_STEP_PX;
        /** Same as “play animation → walk” one stride: bob + sprite-sheet frames. */
        actions.push({
          type: "moveWithBob",
          distance,
          style: "walk",
        });
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
      case "ollie_point_towards": {
        const dir = String(current.getFieldValue("DIR") ?? "up");
        const deg =
          dir === "right"
            ? 90
            : dir === "down"
              ? 180
              : dir === "left"
                ? -90
                : 0;
        actions.push({ type: "setHeading", degrees: deg });
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
        const raw = String(current.getFieldValue("COSTUME") ?? "");
        const id = resolveCostumeFieldForExecution(raw);
        if (id) {
          actions.push({ type: "costume", id });
        }
        break;
      }
      case "ollie_next_costume":
        actions.push({ type: "nextCostume" });
        break;
      case "ollie_switch_scene": {
        const id = String(current.getFieldValue("SCENE"));
        if (isOllieSceneId(id)) actions.push({ type: "scene", id });
        break;
      }
      case "ollie_play_animation": {
        const id = String(current.getFieldValue("ANIMATION") ?? "wave");
        for (const act of getAnimationPresetActions(id)) {
          if (actions.length >= MAX_OLLIE_ACTIONS) return;
          actions.push(act);
        }
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
      case "ollie_forever": {
        const inner = current.getInputTargetBlock("DO");
        for (let i = 0; i < MAX_FOREVER_UNROLL; i += 1) {
          if (actions.length >= MAX_OLLIE_ACTIONS) return;
          walkStatementChain(inner, actions);
        }
        break;
      }
      case "ollie_stop": {
        const scope = current.getFieldValue("SCOPE");
        actions.push({
          type: "stop",
          scope: scope === "ALL" ? "all" : "script",
        });
        return;
      }
      case "ollie_sensing_reset_timer":
        actions.push({ type: "resetTimer" });
        break;
      case "controls_if": {
        let i = 0;
        const branches: {
          cond: SerializedBoolExpr;
          body: OllieAction[];
        }[] = [];
        let allDynamic = true;
        while (current.getInput(`IF${i}`)) {
          const c = serializeBoolExpr(current.getInputTargetBlock(`IF${i}`));
          if (!c) {
            allDynamic = false;
            break;
          }
          branches.push({
            cond: c,
            body: collectChainActions(current.getInputTargetBlock(`DO${i}`)),
          });
          i += 1;
        }
        if (allDynamic && branches.length > 0) {
          let elseBody: OllieAction[] | undefined;
          if (current.getInput("ELSE")) {
            elseBody = collectChainActions(
              current.getInputTargetBlock("ELSE"),
            );
          }
          actions.push({ type: "ifChainDynamic", branches, elseBody });
          break;
        }
        let j = 0;
        let matched = false;
        while (current.getInput(`IF${j}`)) {
          if (evaluateBoolean(current.getInputTargetBlock(`IF${j}`))) {
            walkStatementChain(current.getInputTargetBlock(`DO${j}`), actions);
            matched = true;
            break;
          }
          j += 1;
        }
        if (!matched && current.getInput("ELSE")) {
          walkStatementChain(current.getInputTargetBlock("ELSE"), actions);
        }
        break;
      }
      case "controls_ifelse": {
        const dynCond = serializeBoolExpr(
          current.getInputTargetBlock("IF0"),
        );
        if (dynCond) {
          actions.push({
            type: "ifChainDynamic",
            branches: [
              {
                cond: dynCond,
                body: collectChainActions(
                  current.getInputTargetBlock("DO0"),
                ),
              },
            ],
            elseBody: collectChainActions(
              current.getInputTargetBlock("ELSE"),
            ),
          });
          break;
        }
        if (evaluateBoolean(current.getInputTargetBlock("IF0"))) {
          walkStatementChain(current.getInputTargetBlock("DO0"), actions);
        } else {
          walkStatementChain(current.getInputTargetBlock("ELSE"), actions);
        }
        break;
      }
      case "controls_whileUntil": {
        const mode = current.getFieldValue("MODE");
        const boolBlock = current.getInputTargetBlock("BOOL");
        const inner = current.getInputTargetBlock("DO");
        const dyn = serializeBoolExpr(boolBlock);
        if (dyn) {
          actions.push({
            type: "whileUntilDynamic",
            mode: mode === "WHILE" ? "WHILE" : "UNTIL",
            cond: dyn,
            body: collectChainActions(inner),
          });
          break;
        }
        let iter = 0;
        while (iter < MAX_WHILE_UNROLL && actions.length < MAX_OLLIE_ACTIONS) {
          const c = evaluateBoolean(boolBlock);
          const go = mode === "WHILE" ? c : !c;
          if (!go) break;
          walkStatementChain(inner, actions);
          iter += 1;
        }
        break;
      }
      case "controls_repeat_ext": {
        const raw = Math.floor(
          Math.abs(evaluateNumber(current.getInputTargetBlock("TIMES"))),
        );
        const times = Math.min(MAX_REPEAT_UNROLL, Math.max(0, raw));
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
