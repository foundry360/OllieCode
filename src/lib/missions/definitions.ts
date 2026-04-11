import { collectBlockTypesFromWorkspaceSave } from "@/lib/missions/collectBlockTypes";

export type MissionDefinition = {
  id: string;
  title: string;
  description: string;
  /** True when the learner’s programs satisfy this adventure (after a successful Run). */
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

/** User-created adventures use `?mission=custom-<uuid>` for a distinct save slot per project. */
export const CUSTOM_MISSION_PREFIX = "custom-";

export function isCustomMissionId(id: string): boolean {
  return id.startsWith(CUSTOM_MISSION_PREFIX);
}

/** New blank adventure slot — call from the workspace only (uses `crypto.randomUUID`). */
export function createCustomMissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${CUSTOM_MISSION_PREFIX}${crypto.randomUUID()}`;
  }
  return `${CUSTOM_MISSION_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Adventures (catalog entries) are selected with `?mission=<id>` on `/workspace`. */
export const MISSIONS: MissionDefinition[] = [
  {
    id: "first-move",
    title: "Robot path",
    description:
      "Help Ollie follow the path: switch the backdrop to Path if you like, snap a Move block under When Run clicked, tap Run, then save your adventure.",
    isComplete: (workspaces) =>
      hasBlockTypeInAnyWorkspace(workspaces, "ollie_move_forward"),
  },
];

const byId = new Map(MISSIONS.map((m) => [m.id, m]));

const customMissionDefinition = (id: string): MissionDefinition => ({
  id,
  title: "Untitled Adventure",
  description:
    "Your project. Use Save to give it a name and keep it in your adventures list.",
  isComplete: () => false,
});

export function getMissionById(id: string): MissionDefinition | undefined {
  return byId.get(id) ?? (isCustomMissionId(id) ? customMissionDefinition(id) : undefined);
}
