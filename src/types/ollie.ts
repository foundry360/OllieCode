/**
 * Serialized actions produced from Blockly workspace execution.
 * Scratch-inspired blocks (Motion / Looks / Sound) align with beginner tutorials.
 */
import {
  migrateCostumeIdFromStorage,
  type OllieSceneId,
  type OllieSpriteCostumeId,
} from "@/lib/canvas/stageAssets";

/** One character on stage — each has its own Blockly script (like Scratch sprites). */
export type StageActor = {
  id: string;
  /** Sprite label shown in the UI — not a person’s real name. */
  label: string;
  costumeId: OllieSpriteCostumeId;
};

/** Legacy saves used `name` for sprite label; map to {@link StageActor.label}. */
export function normalizeStageActor(
  raw: { id: string; costumeId: string } & {
    label?: string;
    name?: string;
  },
): StageActor {
  const label = raw.label ?? raw.name ?? "Sprite";
  return {
    id: raw.id,
    label,
    costumeId: migrateCostumeIdFromStorage(raw.costumeId),
  };
}

/** @deprecated Use OllieSpriteCostumeId */
export type OllieCostume = OllieSpriteCostumeId;

export type OllieAction =
  | { type: "move"; distance: number }
  /**
   * Move forward (along heading) with a vertical bob so walk/run read as animated
   * without extra costume frames. Used by “play animation” presets.
   */
  | { type: "moveWithBob"; distance: number; style: "walk" | "run" }
  | { type: "rotate"; degrees: number }
  | { type: "setHeading"; degrees: number }
  /**
   * goTo / glideTo: xPct, yPct are Scratch-style stage coords in −100…100
   * (center 0,0; +y toward top, −y toward bottom).
   */
  | { type: "goTo"; xPct: number; yPct: number }
  | { type: "glideTo"; secs: number; xPct: number; yPct: number }
  /**
   * Vertical hop: glide up in Scratch y by `peakYPct`, then back (same Scratch x).
   * Used by “play animation → jump”.
   */
  | { type: "jumpArc"; peakYPct: number; halfSecs: number }
  | { type: "bounceEdge" }
  | { type: "say"; text: string; ms: number }
  | { type: "think"; text: string; ms: number }
  | { type: "costume"; id: OllieSpriteCostumeId }
  /** Advance to the next costume in the catalog order (like Scratch’s “next costume”). */
  | { type: "nextCostume" }
  | { type: "scene"; id: OllieSceneId }
  | { type: "sound"; id: "pop" | "boing" | "cheer" }
  | { type: "soundWait"; id: "pop" | "boing" | "cheer"; ms: number }
  | { type: "wait"; ms: number }
  /** Scratch-style message — handled by the stage runtime, not queued as sprite motion. */
  | { type: "broadcast"; message: string }
  | { type: "broadcastWait"; message: string }
  | { type: "stop"; scope: "all" | "script" }
  /**
   * Scratch-style timer — resets with {@link OllieAction} `resetTimer` or at the start of a run.
   */
  | { type: "resetTimer" }
  /**
   * Repeat body while/until a condition that depends on sensing (mouse, keys, edge, …).
   * Evaluated live on the stage during Run — use with Sensing + Control blocks.
   */
  | {
      type: "whileUntilDynamic";
      mode: "WHILE" | "UNTIL";
      cond: SerializedBoolExpr;
      body: OllieAction[];
    }
  /**
   * If / else if / else where each condition may use Sensing reporters (evaluated live).
   */
  | {
      type: "ifChainDynamic";
      branches: { cond: SerializedBoolExpr; body: OllieAction[] }[];
      elseBody?: OllieAction[];
    };

/**
 * Serializable boolean expression for runtime sensing (compiled from Blockly).
 * Keys are short to keep project JSON small.
 */
export type SerializedBoolExpr =
  | { k: "b"; v: boolean }
  | { k: "not"; a: SerializedBoolExpr }
  | { k: "and" | "or"; a: SerializedBoolExpr; b: SerializedBoolExpr }
  | {
      k: "cmp";
      op: "EQ" | "NEQ" | "LT" | "LTE" | "GT" | "GTE";
      a: SerializedNumExpr;
      b: SerializedNumExpr;
    }
  | { k: "keyDown"; keyId: string }
  | { k: "touchEdge" }
  | { k: "touchMouse" }
  | { k: "mouseDown" };

/**
 * Serializable numeric expression (math + sensing reporters).
 */
export type SerializedNumExpr =
  | { k: "n"; v: number }
  | { k: "mx" }
  | { k: "my" }
  | { k: "distMouse" }
  | { k: "timer" }
  | {
      k: "arith";
      op: "ADD" | "MINUS" | "MULTIPLY" | "DIVIDE" | "POWER";
      a: SerializedNumExpr;
      b: SerializedNumExpr;
    }
  | { k: "neg"; a: SerializedNumExpr }
  | {
      k: "single";
      op: string;
      a: SerializedNumExpr;
    }
  | { k: "round"; op: "ROUND" | "ROUNDUP" | "ROUNDDOWN"; a: SerializedNumExpr }
  | { k: "mod"; a: SerializedNumExpr; b: SerializedNumExpr }
  | { k: "constrain"; v: SerializedNumExpr; lo: SerializedNumExpr; hi: SerializedNumExpr }
  | { k: "randInt"; a: SerializedNumExpr; b: SerializedNumExpr }
  | { k: "rand" }
  | { k: "atan2"; x: SerializedNumExpr; y: SerializedNumExpr };

/**
 * One sprite’s Blockly workspace compiled into runnable scripts (multiple event hats).
 */
export type SpriteScriptPlan = {
  /** Each `when Run clicked` stack (multiple hats allowed, Scratch-style). */
  runScripts: OllieAction[][];
  keyScripts: { keyId: string; actions: OllieAction[] }[];
  stageClickScripts: OllieAction[][];
  backdropScripts: { sceneId: OllieSceneId; actions: OllieAction[] }[];
  broadcastScripts: { message: string; actions: OllieAction[] }[];
};

/** Missions the user has saved work for (merged across saves / devices via project JSON). */
export type SavedMissionProgressEntry = {
  missionId: string;
  savedAt: string;
  /** Name the learner chose when saving (optional on older data). */
  displayName?: string;
};

export type ProjectPayload = {
  /** Blockly workspace JSON — legacy single-sprite save; used if `workspacesByActorId` absent */
  workspace: Record<string, unknown>;
  /** Per-sprite scripts (Scratch-style) */
  workspacesByActorId?: Record<string, Record<string, unknown>>;
  /** Actors may contain legacy `name` instead of `label` — normalize on load. */
  actors?: StageActor[];
  /** Bottom → top draw order. Prefer over legacy `sceneId`. */
  sceneLayerIds?: OllieSceneId[];
  sceneId?: OllieSceneId;
  /** Project title (not a user’s real name). */
  name: string;
  updatedAt: string;
  /** Optional: missions with saved progress (for the Missions list + cloud sync). */
  savedMissionProgress?: SavedMissionProgressEntry[];
};
