import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import { collectBlockTypesFromWorkspaceSave } from "@/lib/missions/collectBlockTypes";

export type MissionDefinition = {
  id: string;
  title: string;
  description: string;
  /** True when the learner’s programs satisfy this adventure (after a successful Run). */
  isComplete: (workspacesByActorId: Record<string, Record<string, unknown>>) => boolean;
  /**
   * Adventures modal thumbnail when there is no local project snapshot yet
   * (e.g. before first Save on this device).
   */
  cardPreviewSceneId?: OllieSceneId;
  /** Default sprite costume when opening this catalog adventure (workspace starter). */
  starterCostumeId?: OllieSpriteCostumeId;
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

/**
 * Built-in catalog adventures that are starter templates only: signed-in users
 * cannot overwrite cloud/local progress under this id — they must save a named copy (custom mission).
 */
const CATALOG_TEMPLATE_ONLY_IDS = new Set<string>(["first-move"]);

export function isCatalogTemplateMissionId(id: string): boolean {
  return CATALOG_TEMPLATE_ONLY_IDS.has(id);
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
    title: "Welcome to Ollie Code",
    description:
      "Tap Run to see Ollie say “Welcome Adventurer!” for five seconds. Then use Save to name your own copy of this adventure.",
    isComplete: (workspaces) =>
      hasBlockTypeInAnyWorkspace(workspaces, "ollie_say"),
    cardPreviewSceneId: "path",
    starterCostumeId: "welcomebot",
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
