import * as Blockly from "blockly/core";
import type { Block } from "blockly/core";
import { serialization } from "blockly/core";
import { parsePaintedCostumeFieldValue } from "@/lib/blockly/costumeDropdownRegistry";
import {
  isOllieSceneId,
  resolveCostumeFieldForExecution,
} from "@/lib/canvas/stageAssets";
import {
  evaluateBoolean,
  evaluateNumber,
} from "@/lib/blockly/evaluateBlock";
import {
  getBlocklyVariableId,
  getBlocklyVariableName,
  serializeBoolExpr,
  serializeColorExpr,
  serializeNumExpr,
  serializeStringExpr,
} from "@/lib/blockly/sensingSerialize";
import { isOllieSoundId } from "@/lib/sounds/ollieSounds";
import { getAnimationPresetActions } from "@/lib/canvas/ollieAnimationPresets";
import type {
  OllieAction,
  SerializedBoolExpr,
  SerializedNumExpr,
  SerializedStringExpr,
  SpriteScriptPlan,
} from "@/types/ollie";

function numLit(v: number): SerializedNumExpr {
  return { k: "n", v };
}

function mulNum(a: SerializedNumExpr, factor: number): SerializedNumExpr {
  return { k: "arith", op: "MULTIPLY", a, b: { k: "n", v: factor } };
}

function secsToMsExpr(secs: SerializedNumExpr): SerializedNumExpr {
  return mulNum(secs, 1000);
}

/**
 * Interprets Ollie stack blocks (Motion / Looks / Sound / Control / Events).
 * Logic blocks drive control flow; Math blocks are evaluated via {@link evaluateNumber} / sensing serialization.
 */

const BASE_STEP_PX = 2.4;

/** Prevents Run from freezing the tab on huge repeats or long scripts. */
const MAX_OLLIE_ACTIONS = 8_000;
const MAX_REPEAT_UNROLL = 2_000;
const MAX_WHILE_UNROLL = 2_000;

/** Text / join blocks for `ask` message (no reporters in v1). */
function extractStaticStringFromBlock(block: Block | null): string {
  if (!block) return "";
  if (block.type === "text") {
    return String(block.getFieldValue("TEXT") ?? "");
  }
  if (block.type === "text_join") {
    let i = 0;
    let out = "";
    while (block.getInput(`ADD${i}`)) {
      out += extractStaticStringFromBlock(
        block.getInputTargetBlock(`ADD${i}`),
      );
      i += 1;
    }
    return out;
  }
  return "";
}

function walkStatementChain(
  block: Blockly.Block | null,
  actions: OllieAction[],
): void {
  let current: Blockly.Block | null = block;
  while (current) {
    switch (current.type) {
      case "ollie_move_forward": {
        const stepsSer =
          serializeNumExpr(current.getInputTargetBlock("STEPS")) ?? numLit(10);
        if (stepsSer.k === "n") {
          actions.push({
            type: "moveWithBob",
            distance: numLit(stepsSer.v * BASE_STEP_PX),
            style: "walk",
          });
        } else {
          actions.push({
            type: "moveWithBob",
            distance: mulNum(stepsSer, BASE_STEP_PX),
            style: "walk",
          });
        }
        break;
      }
      case "ollie_turn": {
        const angle =
          serializeNumExpr(current.getInputTargetBlock("ANGLE")) ?? numLit(0);
        actions.push({ type: "rotate", degrees: angle });
        break;
      }
      case "ollie_turn_left": {
        const angleSer =
          serializeNumExpr(current.getInputTargetBlock("ANGLE")) ?? numLit(15);
        if (angleSer.k === "n") {
          actions.push({
            type: "rotate",
            degrees: numLit(-Math.abs(angleSer.v)),
          });
        } else {
          actions.push({
            type: "rotate",
            degrees: { k: "neg", a: { k: "single", op: "ABS", a: angleSer } },
          });
        }
        break;
      }
      case "ollie_turn_right": {
        const angleSer =
          serializeNumExpr(current.getInputTargetBlock("ANGLE")) ?? numLit(15);
        if (angleSer.k === "n") {
          actions.push({
            type: "rotate",
            degrees: numLit(Math.abs(angleSer.v)),
          });
        } else {
          actions.push({
            type: "rotate",
            degrees: { k: "single", op: "ABS", a: angleSer },
          });
        }
        break;
      }
      case "ollie_point_in_direction": {
        const angle =
          serializeNumExpr(current.getInputTargetBlock("ANGLE")) ?? numLit(0);
        actions.push({ type: "setHeading", degrees: angle });
        break;
      }
      case "ollie_set_point_toward_aim": {
        const lateralSer =
          serializeNumExpr(current.getInputTargetBlock("OFFPCT")) ?? numLit(0);
        actions.push({
          type: "setPointTowardAim",
          origin: "custom",
          forwardPx: 0,
          lateralPx: undefined,
          lateralPct: lateralSer,
        });
        break;
      }
      case "ollie_point_towards": {
        const dir = String(current.getFieldValue("DIR") ?? "up");
        if (dir === "mouse") {
          actions.push({ type: "pointTowardsMouse" });
          break;
        }
        const deg =
          dir === "right"
            ? 90
            : dir === "down"
              ? 180
              : dir === "left"
                ? -90
                : 0;
        actions.push({ type: "setHeading", degrees: numLit(deg) });
        break;
      }
      case "ollie_go_to_xy": {
        const xSer =
          serializeNumExpr(current.getInputTargetBlock("XPCT")) ?? numLit(0);
        const ySer =
          serializeNumExpr(current.getInputTargetBlock("YPCT")) ?? numLit(0);
        actions.push({
          type: "goTo",
          xPct: { k: "constrain", v: xSer, lo: numLit(-100), hi: numLit(100) },
          yPct: { k: "constrain", v: ySer, lo: numLit(-100), hi: numLit(100) },
        });
        break;
      }
      case "ollie_go_to_target": {
        const raw = String(current.getFieldValue("TARGET") ?? "random");
        const target = raw === "mouse" ? "mouse" : "random";
        actions.push({ type: "goToTarget", target });
        break;
      }
      /** @deprecated Legacy block id — treat as random position. */
      case "ollie_go_to_random_position":
        actions.push({ type: "goToTarget", target: "random" });
        break;
      case "ollie_set_x_to": {
        const ser = serializeNumExpr(current.getInputTargetBlock("XPCT"));
        actions.push({
          type: "setXPct",
          x: ser ?? { k: "n", v: 0 },
        });
        break;
      }
      case "ollie_change_x_by": {
        const dSer =
          serializeNumExpr(current.getInputTargetBlock("DX")) ?? numLit(0);
        actions.push({
          type: "changeXPctBy",
          deltaPct: {
            k: "constrain",
            v: dSer,
            lo: numLit(-200),
            hi: numLit(200),
          },
        });
        break;
      }
      case "ollie_change_y_by": {
        const dSer =
          serializeNumExpr(current.getInputTargetBlock("DY")) ?? numLit(0);
        actions.push({
          type: "changeYPctBy",
          deltaPct: {
            k: "constrain",
            v: dSer,
            lo: numLit(-200),
            hi: numLit(200),
          },
        });
        break;
      }
      case "ollie_glide_to": {
        const secsSer =
          serializeNumExpr(current.getInputTargetBlock("SECS")) ?? numLit(1);
        const xSer =
          serializeNumExpr(current.getInputTargetBlock("XPCT")) ?? numLit(0);
        const ySer =
          serializeNumExpr(current.getInputTargetBlock("YPCT")) ?? numLit(0);
        actions.push({
          type: "glideTo",
          secs: { k: "constrain", v: secsSer, lo: numLit(0.1), hi: numLit(15) },
          xPct: { k: "constrain", v: xSer, lo: numLit(-100), hi: numLit(100) },
          yPct: { k: "constrain", v: ySer, lo: numLit(-100), hi: numLit(100) },
        });
        break;
      }
      case "ollie_if_on_edge_bounce":
        actions.push({ type: "bounceEdge" });
        break;
      case "ollie_say": {
        const text = String(current.getFieldValue("TEXT") ?? "");
        const secsSer =
          serializeNumExpr(current.getInputTargetBlock("SECS")) ?? numLit(2);
        actions.push({
          type: "say",
          text: text.slice(0, 120),
          ms: secsToMsExpr(secsSer),
        });
        break;
      }
      case "ollie_say_value": {
        const secsSer =
          serializeNumExpr(current.getInputTargetBlock("SECS")) ?? numLit(2);
        const expr = serializeStringExpr(current.getInputTargetBlock("TEXT"));
        actions.push({
          type: "sayDynamic",
          expr,
          ms: secsToMsExpr(secsSer),
        });
        break;
      }
      case "ollie_think": {
        const text = String(current.getFieldValue("TEXT") ?? "");
        const secsSer =
          serializeNumExpr(current.getInputTargetBlock("SECS")) ?? numLit(2);
        actions.push({
          type: "think",
          text: text.slice(0, 120),
          ms: secsToMsExpr(secsSer),
        });
        break;
      }
      case "ollie_set_speech_bubble_color": {
        const expr = serializeColorExpr(
          current.getInputTargetBlock("COLOR") ??
            current.getInputTargetBlock("COLOUR"),
        );
        if (expr) {
          actions.push({ type: "setSpeechBubbleColor", expr });
        }
        break;
      }
      case "ollie_switch_costume": {
        const raw = String(current.getFieldValue("COSTUME") ?? "");
        const paintedUrl = parsePaintedCostumeFieldValue(raw);
        if (paintedUrl) {
          actions.push({ type: "setPaintedCostumeUrl", url: paintedUrl });
          break;
        }
        const id = resolveCostumeFieldForExecution(raw);
        if (id) {
          actions.push({ type: "costume", id });
        }
        break;
      }
      case "ollie_next_costume":
        actions.push({ type: "nextCostume" });
        break;
      case "ollie_grow_size": {
        const pctSer =
          serializeNumExpr(current.getInputTargetBlock("PCT")) ?? numLit(10);
        const rounded: SerializedNumExpr = {
          k: "round",
          op: "ROUND",
          a: pctSer,
        };
        actions.push({
          type: "changeSize",
          deltaPct: {
            k: "constrain",
            v: rounded,
            lo: numLit(1),
            hi: numLit(200),
          },
        });
        break;
      }
      case "ollie_shrink_size": {
        const pctSer =
          serializeNumExpr(current.getInputTargetBlock("PCT")) ?? numLit(10);
        const rounded: SerializedNumExpr = {
          k: "round",
          op: "ROUND",
          a: pctSer,
        };
        const pos = {
          k: "constrain",
          v: rounded,
          lo: numLit(1),
          hi: numLit(200),
        } as SerializedNumExpr;
        actions.push({
          type: "changeSize",
          deltaPct: { k: "neg", a: pos },
        });
        break;
      }
      case "ollie_switch_scene": {
        const id = String(current.getFieldValue("SCENE"));
        if (isOllieSceneId(id)) actions.push({ type: "scene", id });
        break;
      }
      case "ollie_next_scene":
        actions.push({ type: "nextScene" });
        break;
      case "ollie_show":
        actions.push({ type: "setVisible", visible: true });
        break;
      case "ollie_hide":
        actions.push({ type: "setVisible", visible: false });
        break;
      case "ollie_change_size_by": {
        const dSer =
          serializeNumExpr(current.getInputTargetBlock("DELTA")) ?? numLit(0);
        const rounded: SerializedNumExpr = {
          k: "round",
          op: "ROUND",
          a: dSer,
        };
        actions.push({
          type: "changeSize",
          deltaPct: {
            k: "constrain",
            v: rounded,
            lo: numLit(-500),
            hi: numLit(500),
          },
        });
        break;
      }
      case "ollie_set_size_to": {
        const pctSer =
          serializeNumExpr(current.getInputTargetBlock("PCT")) ?? numLit(100);
        const rounded: SerializedNumExpr = {
          k: "round",
          op: "ROUND",
          a: pctSer,
        };
        actions.push({
          type: "setSizePct",
          sizePct: {
            k: "constrain",
            v: rounded,
            lo: numLit(5),
            hi: numLit(500),
          },
        });
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
        if (isOllieSoundId(id)) actions.push({ type: "sound", id });
        break;
      }
      case "ollie_play_sound_until_done": {
        const id = String(current.getFieldValue("SOUND"));
        if (isOllieSoundId(id)) {
          actions.push({
            type: "soundWait",
            id,
            ms: 900,
          });
        }
        break;
      }
      case "ollie_wait": {
        const secsSer =
          serializeNumExpr(current.getInputTargetBlock("SECS")) ?? numLit(0);
        const secsNonNeg = {
          k: "constrain",
          v: secsSer,
          lo: numLit(0),
          hi: numLit(600),
        } as SerializedNumExpr;
        actions.push({ type: "wait", ms: mulNum(secsNonNeg, 1000) });
        break;
      }
      case "ollie_wait_until": {
        const boolBlock = current.getInputTargetBlock("BOOL");
        const dyn = serializeBoolExpr(boolBlock);
        if (dyn) {
          actions.push({ type: "waitUntilDynamic", cond: dyn });
        }
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
        const inner = current.getInputTargetBlock("DO");
        if (!inner) break;
        const timesBlock = current.getInputTargetBlock("TIMES");
        const ser = serializeNumExpr(timesBlock);
        if (ser) {
          if (ser.k === "n") {
            const times = Math.min(
              MAX_REPEAT_UNROLL,
              Math.max(1, Math.floor(ser.v)),
            );
            for (let i = 0; i < times; i += 1) {
              if (actions.length >= MAX_OLLIE_ACTIONS) return;
              walkStatementChain(inner, actions);
            }
          } else {
            actions.push({
              type: "repeatDynamic",
              times: ser,
              body: collectChainActions(inner),
            });
          }
        } else {
          const raw = Math.floor(
            Math.abs(evaluateNumber(timesBlock)),
          );
          const times = Math.min(MAX_REPEAT_UNROLL, Math.max(1, raw));
          for (let i = 0; i < times; i += 1) {
            if (actions.length >= MAX_OLLIE_ACTIONS) return;
            walkStatementChain(inner, actions);
          }
        }
        break;
      }
      case "ollie_forever": {
        const inner = current.getInputTargetBlock("DO");
        actions.push({
          type: "foreverLoop",
          body: collectChainActions(inner),
        });
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
      case "ollie_delete_this_clone":
        actions.push({ type: "deleteThisClone" });
        return;
      case "ollie_create_clone":
        actions.push({ type: "createClone" });
        break;
      case "ollie_sensing_reset_timer":
        actions.push({ type: "resetTimer" });
        break;
      case "controls_if": {
        let i = 0;
        const branches: {
          cond: SerializedBoolExpr;
          body: OllieAction[];
        }[] = [];
        while (current.getInput(`IF${i}`)) {
          const c = serializeBoolExpr(current.getInputTargetBlock(`IF${i}`));
          if (!c) break;
          branches.push({
            cond: c,
            body: collectChainActions(current.getInputTargetBlock(`DO${i}`)),
          });
          i += 1;
        }
        /**
         * Use runtime `ifChainDynamic` for **any** branch we could serialize. If we required
         * *all* elseif conditions to serialize, a single unsupported block would fall through
         * to `evaluateBoolean`, where `variables_get` is always 0 — breaking quizzes (always
         * the else branch). Later elseifs that failed to serialize are omitted (rare).
         */
        if (branches.length > 0) {
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
        const inner = current.getInputTargetBlock("DO");
        if (!inner) break;
        const timesBlock = current.getInputTargetBlock("TIMES");
        const ser = serializeNumExpr(timesBlock);
        if (ser) {
          if (ser.k === "n") {
            const times = Math.min(
              MAX_REPEAT_UNROLL,
              Math.max(0, Math.floor(ser.v)),
            );
            for (let i = 0; i < times; i += 1) {
              if (actions.length >= MAX_OLLIE_ACTIONS) return;
              walkStatementChain(inner, actions);
            }
          } else {
            actions.push({
              type: "repeatDynamic",
              times: ser,
              body: collectChainActions(inner),
            });
          }
        } else {
          const raw = Math.floor(
            Math.abs(evaluateNumber(timesBlock)),
          );
          const times = Math.min(MAX_REPEAT_UNROLL, Math.max(0, raw));
          for (let i = 0; i < times; i += 1) {
            if (actions.length >= MAX_OLLIE_ACTIONS) return;
            walkStatementChain(inner, actions);
          }
        }
        break;
      }
      case "variables_set":
      case "variables_set_dynamic": {
        const varId = getBlocklyVariableId(current);
        const varName = getBlocklyVariableName(current);
        const valueBlock = current.getInputTargetBlock("VALUE");
        if ((!varId && !varName?.trim()) || !valueBlock) break;
        if (
          valueBlock.type === "text_prompt_ext" ||
          valueBlock.type === "ollie_ask_number"
        ) {
          const textSub = valueBlock.getInputTargetBlock("TEXT");
          const msg = extractStaticStringFromBlock(textSub);
          const messageExpr = serializeStringExpr(textSub);
          const numberOnly =
            valueBlock.type === "ollie_ask_number" ||
            String(valueBlock.getFieldValue("TYPE") ?? "TEXT") === "NUMBER";
          actions.push({
            type: "promptAndSetVar",
            varId: varId || "",
            varName,
            message: msg || "?",
            messageExpr,
            numberOnly,
          });
          break;
        }
        if (valueBlock.type === "text_prompt") {
          const msg = String(valueBlock.getFieldValue("TEXT") ?? "");
          const messageExpr: SerializedStringExpr = { k: "lit", v: msg };
          const numberOnly =
            String(valueBlock.getFieldValue("TYPE") ?? "TEXT") === "NUMBER";
          actions.push({
            type: "promptAndSetVar",
            varId: varId || "",
            varName,
            message: msg || "?",
            messageExpr,
            numberOnly,
          });
          break;
        }
        const ser = serializeNumExpr(valueBlock);
        if (ser) {
          actions.push({
            type: "setVar",
            varId: varId || "",
            varName,
            value: ser,
          });
        }
        break;
      }
      case "math_change": {
        const varId = getBlocklyVariableId(current);
        const varName = getBlocklyVariableName(current);
        const ser = serializeNumExpr(current.getInputTargetBlock("DELTA"));
        if ((varId || varName?.trim()) && ser) {
          actions.push({
            type: "changeVar",
            varId: varId || "",
            varName,
            delta: ser,
          });
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
    cloneScripts: [],
  };
}

/**
 * All event hat types that start a script stack.
 */
const HAT_TYPES = new Set([
  "ollie_start",
  "ollie_clone_start",
  "ollie_event_key_pressed",
  "ollie_event_stage_clicked",
  "ollie_event_backdrop_switches",
  "ollie_event_broadcast_received",
]);

/**
 * Compile one sprite workspace into separate scripts (multiple hats, Scratch-style).
 */
/** True if any event hat compiled to at least one action (any script type). */
export function spriteScriptPlanHasAnyActions(plan: SpriteScriptPlan): boolean {
  if (plan.runScripts.some((c) => c.length > 0)) return true;
  if (plan.keyScripts.some((k) => k.actions.length > 0)) return true;
  if (plan.stageClickScripts.some((c) => c.length > 0)) return true;
  if (plan.backdropScripts.some((b) => b.actions.length > 0)) return true;
  if (plan.broadcastScripts.some((b) => b.actions.length > 0)) return true;
  if ((plan.cloneScripts ?? []).some((c) => c.length > 0)) return true;
  return false;
}

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
      case "ollie_clone_start":
        plan.cloneScripts.push(chain);
        break;
      case "ollie_event_key_pressed": {
        const raw = String(block.getFieldValue("KEY") ?? "space")
          .trim()
          .toLowerCase();
        const keyId = raw || "space";
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
