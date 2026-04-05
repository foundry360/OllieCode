import { collectBlockTypesFromWorkspaceSave } from "@/lib/missions/collectBlockTypes";

export type MissionDefinition = {
  id: string;
  title: string;
  description: string;
  /** True when the learner’s programs satisfy this mission (after a successful Run). */
  isComplete: (workspacesByActorId: Record<string, Record<string, unknown>>) => boolean;
};

function hasBlockTypeInAnyWorkspace(
  workspacesByActorId: Record<string, Record<string, unknown>>,
  blockType: string,
): boolean {
  for (const save of Object.values(workspacesByActorId)) {
    if (!save || typeof save !== "object") continue;
    const types = collectBlockTypesFromWorkspaceSave(save);
    if (types.has(blockType)) return true;
  }
  return false;
}

/** User-created missions use `?mission=custom-<uuid>` for a distinct save slot per project. */
export const CUSTOM_MISSION_PREFIX = "custom-";

export function isCustomMissionId(id: string): boolean {
  return id.startsWith(CUSTOM_MISSION_PREFIX);
}

/** New blank mission slot — call from the workspace only (uses `crypto.randomUUID`). */
export function createCustomMissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${CUSTOM_MISSION_PREFIX}${crypto.randomUUID()}`;
  }
  return `${CUSTOM_MISSION_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Missions are selected with `?mission=<id>` on `/workspace`. */
export const MISSIONS: MissionDefinition[] = [
  {
    id: "first-move",
    title: "First move",
    description:
      "Your first coding mission: add a Move block under the green flag and run your program.",
    isComplete: (workspaces) =>
      hasBlockTypeInAnyWorkspace(workspaces, "ollie_move_forward"),
  },
];

const byId = new Map(MISSIONS.map((m) => [m.id, m]));

const customMissionDefinition = (id: string): MissionDefinition => ({
  id,
  title: "My mission",
  description: "Your project. Use Save to give it a name and keep it in your list.",
  isComplete: () => false,
});

export function getMissionById(id: string): MissionDefinition | undefined {
  return byId.get(id) ?? (isCustomMissionId(id) ? customMissionDefinition(id) : undefined);
}
