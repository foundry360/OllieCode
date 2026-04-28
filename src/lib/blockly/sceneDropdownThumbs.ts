import { OLLIE_SCENES } from "@/lib/canvas/stageAssets";
import {
  COSTUME_MENU_THUMB_PX,
  imageUrlToContainThumbDataUrl,
} from "@/lib/blockly/costumeDropdownThumbs";

const sceneThumbById = new Map<string, string>();

function solidSceneThumbDataUrl(rgb: readonly [number, number, number]): string {
  const cv = document.createElement("canvas");
  cv.width = COSTUME_MENU_THUMB_PX;
  cv.height = COSTUME_MENU_THUMB_PX;
  const ctx = cv.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  ctx.fillRect(0, 0, COSTUME_MENU_THUMB_PX, COSTUME_MENU_THUMB_PX);
  return cv.toDataURL("image/png");
}

/**
 * Preload square thumbs for every scene (solid swatch or contained image).
 * Call in the browser before the switch scene dropdown is used (e.g. before Blockly `inject`).
 */
export async function preloadSceneDropdownThumbs(): Promise<void> {
  await Promise.all(
    OLLIE_SCENES.map(async (s) => {
      if (s.kind === "solid") {
        sceneThumbById.set(s.id, solidSceneThumbDataUrl(s.rgb));
        return;
      }
      if (s.kind === "image" && s.src) {
        try {
          const dataUrl = await imageUrlToContainThumbDataUrl(s.src);
          if (dataUrl) sceneThumbById.set(s.id, dataUrl);
          else sceneThumbById.set(s.id, s.src);
        } catch {
          sceneThumbById.set(s.id, s.src);
        }
      }
    }),
  );
}

export function getSceneDropdownThumbSrc(
  sceneId: string,
  fallbackSrc: string,
): string {
  const cached = sceneThumbById.get(sceneId);
  if (cached) return cached;
  const s = OLLIE_SCENES.find((x) => x.id === sceneId);
  if (s?.kind === "solid") return solidSceneThumbDataUrl(s.rgb);
  return fallbackSrc;
}

/** Register a square thumb for a My Scenes backdrop (signed URL). */
export async function registerUserSceneDropdownThumb(
  sceneId: string,
  imageUrl: string,
): Promise<void> {
  if (!sceneId.trim() || !imageUrl.trim()) return;
  try {
    const dataUrl = await imageUrlToContainThumbDataUrl(imageUrl);
    if (dataUrl) sceneThumbById.set(sceneId, dataUrl);
    else sceneThumbById.set(sceneId, imageUrl);
  } catch {
    sceneThumbById.set(sceneId, imageUrl);
  }
}
