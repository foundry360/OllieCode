import type { StageActor } from "@/types/ollie";
import {
  DEFAULT_COSTUME_ID,
  getCostumeById,
  type CostumeDef,
} from "@/lib/canvas/stageAssets";

/** Catalog sheet cells draw at `def.width` (200); square cells are 200×200 in stage space. */
export const COSTUME_DISPLAY_BOX_PX = 200;

/**
 * Max edge (contain box) for **painted/uploaded** bitmaps on the P5 stage — below catalog
 * (200) so user art doesn’t dwarf library sprites.
 */
export const PAINTED_COSTUME_FIT_BOX_PX = 96;

/** @deprecated Use {@link COSTUME_DISPLAY_BOX_PX} */
export const PAINTED_COSTUME_DISPLAY_WIDTH = COSTUME_DISPLAY_BOX_PX;

/**
 * Scale trimmed painted/uploaded pixels to fit inside a square box (default 200×200 stage units),
 * same max extent as a typical catalog sheet cell. Uses **contain** so neither side exceeds the
 * box — avoids huge sprites when alpha-trim is narrow but tall (`h = 200×(sh/sw)` blew up).
 */
export function paintedCostumeFitInBox(
  sourceW: number,
  sourceH: number,
  boxPx: number = COSTUME_DISPLAY_BOX_PX,
): { w: number; h: number } {
  if (sourceW <= 0 || sourceH <= 0) return { w: boxPx, h: boxPx };
  const scale = Math.min(boxPx / sourceW, boxPx / sourceH);
  return { w: sourceW * scale, h: sourceH * scale };
}

export type ResolvedActorCostume =
  | { kind: "painted"; src: string; displayBoxPx: number }
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
      displayBoxPx: PAINTED_COSTUME_FIT_BOX_PX,
    };
  }
  const def =
    getCostumeById(actor.costumeId) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  return { kind: "catalog", def };
}
