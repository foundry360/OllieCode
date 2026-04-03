/**
 * Serialized actions produced from Blockly workspace execution.
 * Extend with new block types by adding variants here and handling them in P5Canvas.
 */
export type OllieAction =
  | { type: "move"; distance: number }
  | { type: "rotate"; degrees: number }
  | { type: "sound"; id: "pop" | "boing" | "cheer" }
  | { type: "wait"; ms: number };

export type ProjectPayload = {
  /** Blockly workspace JSON from Blockly.serialization.workspaces.save */
  workspace: Record<string, unknown>;
  name: string;
  updatedAt: string;
};
