/**
 * Serialized actions produced from Blockly workspace execution.
 * Scratch-inspired blocks (Motion / Looks / Sound) align with beginner tutorials.
 */
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";

/** One character on stage — each has its own Blockly script (like Scratch sprites). */
export type StageActor = {
  id: string;
  /** Sprite label shown in the UI — not a person’s real name. */
  label: string;
  costumeId: OllieSpriteCostumeId;
};

/** Legacy saves used `name` for sprite label; map to {@link StageActor.label}. */
export function normalizeStageActor(
  raw: { id: string; costumeId: OllieSpriteCostumeId } & {
    label?: string;
    name?: string;
  },
): StageActor {
  const label = raw.label ?? raw.name ?? "Sprite";
  return { id: raw.id, label, costumeId: raw.costumeId };
}

/** @deprecated Use OllieSpriteCostumeId */
export type OllieCostume = OllieSpriteCostumeId;

export type OllieAction =
  | { type: "move"; distance: number }
  | { type: "rotate"; degrees: number }
  | { type: "setHeading"; degrees: number }
  /**
   * goTo / glideTo: xPct, yPct are Scratch-style stage coords in −100…100
   * (center 0,0; +y toward top, −y toward bottom).
   */
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
  sceneId?: OllieSceneId;
  /** Project title (not a user’s real name). */
  name: string;
  updatedAt: string;
  /** Optional: missions with saved progress (for the Missions list + cloud sync). */
  savedMissionProgress?: SavedMissionProgressEntry[];
};
