import type { StageActor } from "@/types/ollie";
import {
  DEFAULT_COSTUME_ID,
  getCostumeById,
  type CostumeDef,
} from "@/lib/canvas/stageAssets";

/** Display width for painted bitmaps on stage (matches typical catalog `width`). */
export const PAINTED_COSTUME_DISPLAY_WIDTH = 200;

export type ResolvedActorCostume =
  | { kind: "painted"; src: string; displayWidth: number }
  | { kind: "catalog"; def: CostumeDef };

/**
 * Catalog costume, or a user-painted PNG URL stored on the actor (e.g. Supabase).
 */
export function resolveActorCostumeForDisplay(actor: StageActor): ResolvedActorCostume {
  const url = actor.paintedCostumeUrl?.trim();
  if (url) {
    return {
      kind: "painted",
      src: url,
      displayWidth: PAINTED_COSTUME_DISPLAY_WIDTH,
    };
  }
  const def =
    getCostumeById(actor.costumeId) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  return { kind: "catalog", def };
}
