import {
  FieldDropdown,
  type ImageProperties,
  type MenuOption,
} from "blockly/core";
import { OLLIE_SPRITE_COSTUMES } from "@/lib/canvas/stageAssets";
import {
  COSTUME_MENU_THUMB_PX,
  getCatalogCostumeDropdownThumbSrc,
} from "@/lib/blockly/costumeDropdownThumbs";

/** Stored in the “switch costume” field — not a catalog id. */
export const PAINTED_COSTUME_FIELD_PREFIX = "olliePainted:";

function catalogCostumeThumbOptions(): [ImageProperties, string][] {
  return OLLIE_SPRITE_COSTUMES.map((c) => {
    const fallback = c.kind === "image" ? c.src : "";
    const src = getCatalogCostumeDropdownThumbSrc(c.id, fallback);
    const img: ImageProperties = {
      src,
      alt: c.label,
      width: COSTUME_MENU_THUMB_PX,
      height: COSTUME_MENU_THUMB_PX,
    };
    return [img, c.id];
  });
}

type ExtrasGetter = () => [ImageProperties, string][];

let extrasGetter: ExtrasGetter | null = null;

/** Workspace sets this so “switch costume” lists project My Sprites under a divider. */
export function setSwitchCostumeDropdownExtras(getter: ExtrasGetter | null): void {
  extrasGetter = getter;
}

/**
 * Build one [thumbnail, field value] pair for a user-painted / uploaded costume (My Sprites).
 * Pass {@link thumbDataUrl} when precomputed (scaled contain thumb); otherwise falls back to raw URL.
 */
export function paintedCostumeMenuOption(
  label: string,
  imageUrl: string,
  thumbDataUrl?: string,
): [ImageProperties, string] {
  const img: ImageProperties = {
    src: thumbDataUrl ?? imageUrl,
    alt: label,
    width: COSTUME_MENU_THUMB_PX,
    height: COSTUME_MENU_THUMB_PX,
  };
  return [img, `${PAINTED_COSTUME_FIELD_PREFIX}${encodeURIComponent(imageUrl)}`];
}

/**
 * Catalog costume thumbs + optional separator + My Sprite thumbs (same pattern as the canvas sprite picker).
 */
export function getSwitchCostumeDropdownOptions(): MenuOption[] {
  const catalog = catalogCostumeThumbOptions();
  const extras = extrasGetter?.() ?? [];
  if (extras.length === 0) return catalog;
  return [...catalog, FieldDropdown.SEPARATOR, ...extras];
}

export function parsePaintedCostumeFieldValue(
  raw: string | undefined | null,
): string | null {
  const s = String(raw ?? "").trim();
  if (!s.startsWith(PAINTED_COSTUME_FIELD_PREFIX)) return null;
  try {
    return decodeURIComponent(s.slice(PAINTED_COSTUME_FIELD_PREFIX.length));
  } catch {
    return null;
  }
}
