/** Ignore nearly-transparent pixels when finding content bounds. */
const ALPHA_THRESHOLD = 10;

/**
 * Tight axis-aligned bounds of pixels with alpha above {@link ALPHA_THRESHOLD}.
 * Used so wide paint canvases with empty margins scale like catalog sprites.
 */
export function nonTransparentPixelBounds(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
): { sx: number; sy: number; sw: number; sh: number } {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const rowOff = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = pixels[rowOff + x * 4 + 3];
      if (a > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) {
    return { sx: 0, sy: 0, sw: width, sh: height };
  }
  return { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
}
