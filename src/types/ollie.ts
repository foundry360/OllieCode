/**
 * Serialized actions produced from Blockly workspace execution.
 * Scratch-inspired blocks (Motion / Looks / Sound) align with beginner tutorials.
 */
export type OllieCostume = "cat" | "square" | "ball";

export type OllieAction =
  | { type: "move"; distance: number }
  | { type: "rotate"; degrees: number }
  | { type: "setHeading"; degrees: number }
  | { type: "goTo"; xPct: number; yPct: number }
  | { type: "glideTo"; secs: number; xPct: number; yPct: number }
  | { type: "bounceEdge" }
  | { type: "say"; text: string; ms: number }
  | { type: "think"; text: string; ms: number }
  | { type: "costume"; id: OllieCostume }
  | { type: "sound"; id: "pop" | "boing" | "cheer" }
  | { type: "soundWait"; id: "pop" | "boing" | "cheer"; ms: number }
  | { type: "wait"; ms: number };

export type ProjectPayload = {
  /** Blockly workspace JSON from Blockly.serialization.workspaces.save */
  workspace: Record<string, unknown>;
  name: string;
  updatedAt: string;
};
