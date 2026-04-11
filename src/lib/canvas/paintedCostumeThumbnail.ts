import { nonTransparentPixelBounds } from "@/lib/canvas/paintedCostumeBounds";

/** Raster size for trimmed thumbnails (CSS scales to the card). */
const THUMB_INTERNAL_PX = 512;

/** Match picker tile background so letterboxing isn’t harsh white. */
const THUMB_BG = "#f1f5f9";

/** Bump when scaling/crop logic changes (invalidates in-memory cache). */
const CACHE_KEY_PREFIX = "v2-contain:";

const dataUrlCache = new Map<string, string | null>();

/**
 * Builds a square PNG data URL of the opaque content of `src`, alpha-trimmed then scaled
 * with **contain** (full sprite visible, centered, no cropping) so huge sparse canvases
 * don’t look tiny and we don’t zoom the art past the tile.
 */
export async function getPaintedCostumeFillCardDataUrl(
  src: string,
): Promise<string | null> {
  const trimmed = src.trim();
  if (!trimmed) return null;
  const cacheKey = `${CACHE_KEY_PREFIX}${trimmed}`;
  const cached = dataUrlCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const created: string | null = await new Promise<string | null>((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const iw = im.naturalWidth;
        const ih = im.naturalHeight;
        if (iw < 1 || ih < 1) {
          resolve(null);
          return;
        }
        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = iw;
        srcCanvas.height = ih;
        const sctx = srcCanvas.getContext("2d");
        if (!sctx) {
          resolve(null);
          return;
        }
        sctx.drawImage(im, 0, 0);
        const imageData = sctx.getImageData(0, 0, iw, ih);
        const b = nonTransparentPixelBounds(imageData.data, iw, ih);
        let sx = b.sx;
        let sy = b.sy;
        let sw = b.sw;
        let sh = b.sh;
        if (sw <= 0 || sh <= 0 || sw > iw || sh > ih) {
          sx = 0;
          sy = 0;
          sw = iw;
          sh = ih;
        }
        const box = THUMB_INTERNAL_PX;
        const scale = Math.min(box / sw, box / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = (box - dw) / 2;
        const dy = (box - dh) / 2;
        const out = document.createElement("canvas");
        out.width = box;
        out.height = box;
        const octx = out.getContext("2d");
        if (!octx) {
          resolve(null);
          return;
        }
        octx.fillStyle = THUMB_BG;
        octx.fillRect(0, 0, box, box);
        octx.drawImage(srcCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
        resolve(out.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    im.onerror = () => resolve(null);
    im.src = trimmed;
  });

  if (created !== null) {
    dataUrlCache.set(cacheKey, created);
  }
  return created;
}
