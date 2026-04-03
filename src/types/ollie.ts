/**
 * Serialized actions produced from Blockly workspace execution.
 * Scratch-inspired blocks (Motion / Looks / Sound) align with beginner tutorials.
 */
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";

/** One character on stage — each has its own Blockly script (like Scratch sprites). */
export type StageActor = {
  id: string;
  name: string;
  costumeId: OllieSpriteCostumeId;
};

/** @deprecated Use OllieSpriteCostumeId */
export type OllieCostume = OllieSpriteCostumeId;

export type OllieAction =
  | { type: "move"; distance: number }
  | { type: "rotate"; degrees: number }
  | { type: "setHeading"; degrees: number }
  | { type: "goTo"; xPct: number; yPct: number }
  | { type: "glideTo"; secs: number; xPct: number; yPct: number }
  | { type: "bounceEdge" }
  | { type: "say"; text: string; ms: number }
  | { type: "think"; text: string; ms: number }
  | { type: "costume"; id: OllieSpriteCostumeId }
  | { type: "scene"; id: OllieSceneId }
  | { type: "sound"; id: "pop" | "boing" | "cheer" }
  | { type: "soundWait"; id: "pop" | "boing" | "cheer"; ms: number }
  | { type: "wait"; ms: number };

export type ProjectPayload = {
  /** Blockly workspace JSON — legacy single-sprite save; used if `workspacesByActorId` absent */
  workspace: Record<string, unknown>;
  /** Per-sprite scripts (Scratch-style) */
  workspacesByActorId?: Record<string, Record<string, unknown>>;
  actors?: StageActor[];
  sceneId?: OllieSceneId;
  name: string;
  updatedAt: string;
};
