import { OLLIE_SPRITE_COSTUMES } from "@/lib/canvas/stageAssets";

/** Matches Blockly `ImageProperties` — block + dropdown menu sprite previews. */
export const COSTUME_MENU_THUMB_PX = 52;

const catalogThumbById = new Map<string, string>();

/**
 * Raster the first cell of a sprite sheet (or scale a single image) into a small PNG data URL,
 * matching how {@link SpritePreview} shows one frame in the picker (`fillCard` + top-left cell).
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    im.src = src;
  });
}

function drawToThumbDataUrl(
  im: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): string {
  const cv = document.createElement("canvas");
  cv.width = COSTUME_MENU_THUMB_PX;
  cv.height = COSTUME_MENU_THUMB_PX;
  const ctx = cv.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(im, sx, sy, sw, sh, 0, 0, COSTUME_MENU_THUMB_PX, COSTUME_MENU_THUMB_PX);
  return cv.toDataURL("image/png");
}

async function catalogCostumeThumbDataUrl(
  c: (typeof OLLIE_SPRITE_COSTUMES)[number],
): Promise<string> {
  if (c.kind !== "image" || !c.src) return "";
  const im = await loadImageElement(c.src);
  const w = im.naturalWidth || im.width;
  const h = im.naturalHeight || im.height;
  const sheet =
    "spriteSheet" in c && c.spriteSheet
      ? c.spriteSheet
      : { columns: 1, rows: 1 };
  const cols = Math.max(1, sheet.columns);
  const rows = Math.max(1, sheet.rows);
  const cw = w / cols;
  const ch = h / rows;
  return drawToThumbDataUrl(im, 0, 0, cw, ch);
}

/**
 * Preload PNG thumbnails for every catalog costume (first sprite-sheet frame when applicable).
 * Call in the browser before the switch costume dropdown is used (e.g. before Blockly `inject`).
 */
export async function preloadCatalogCostumeDropdownThumbs(): Promise<void> {
  await Promise.all(
    OLLIE_SPRITE_COSTUMES.map(async (c) => {
      if (c.kind !== "image" || !c.src) return;
      try {
        const dataUrl = await catalogCostumeThumbDataUrl(c);
        if (dataUrl) catalogThumbById.set(c.id, dataUrl);
        else catalogThumbById.set(c.id, c.src);
      } catch {
        catalogThumbById.set(c.id, c.src);
      }
    }),
  );
}

export function getCatalogCostumeDropdownThumbSrc(
  costumeId: string,
  fallbackSrc: string,
): string {
  return catalogThumbById.get(costumeId) ?? fallbackSrc;
}

/**
 * Fit a full image (e.g. user-painted URL) into a square thumb — avoids showing a tiny illegible full sheet.
 */
export async function imageUrlToContainThumbDataUrl(
  imageUrl: string,
): Promise<string> {
  const im = await loadImageElement(imageUrl);
  const w = im.naturalWidth || im.width;
  const h = im.naturalHeight || im.height;
  return drawToThumbDataUrl(im, 0, 0, w, h);
}
