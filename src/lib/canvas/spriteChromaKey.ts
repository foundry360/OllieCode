import type { CostumeChromaKey } from "@/lib/canvas/stageAssets";

/** Decode a URL to an element `CanvasRenderingContext2D.drawImage` always accepts. */
export function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

/**
 * Draw `source` at native size and set alpha to 0 for pixels within `threshold`
 * (per RGB channel) of `key.rgb`. Used for sprite sheets with a solid matte color.
 */
export function applyCostumeChromaKeyToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  key: CostumeChromaKey,
): HTMLCanvasElement {
  const thr = key.threshold ?? 14;
  const [kr, kg, kb] = key.rgb;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.drawImage(source, 0, 0, width, height);
  const d = ctx.getImageData(0, 0, width, height);
  const u8 = d.data;
  for (let i = 0; i < u8.length; i += 4) {
    const r = u8[i]!;
    const g = u8[i + 1]!;
    const b = u8[i + 2]!;
    if (
      Math.abs(r - kr) <= thr &&
      Math.abs(g - kg) <= thr &&
      Math.abs(b - kb) <= thr
    ) {
      u8[i + 3] = 0;
    }
  }
  ctx.putImageData(d, 0, 0);
  return canvas;
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}
