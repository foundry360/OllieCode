import type { ImageProperties, MenuOption } from "blockly/core";
import { FieldDropdown } from "blockly/core";
import { OLLIE_SCENES } from "@/lib/canvas/stageAssets";
import { COSTUME_MENU_THUMB_PX } from "@/lib/blockly/costumeDropdownThumbs";
import { getSceneDropdownThumbSrc } from "@/lib/blockly/sceneDropdownThumbs";

function sceneImageThumbOptions(): [ImageProperties, string][] {
  return OLLIE_SCENES.map((s) => {
    const fallback =
      s.kind === "image" && s.src
        ? s.src
        : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const src = getSceneDropdownThumbSrc(s.id, fallback);
    const img: ImageProperties = {
      src,
      alt: s.label,
      width: COSTUME_MENU_THUMB_PX,
      height: COSTUME_MENU_THUMB_PX,
    };
    return [img, s.id];
  });
}

type ImageExtrasGetter = () => [ImageProperties, string][];

let sceneImageThumbExtrasGetter: ImageExtrasGetter | null = null;

/** Workspace sets My Scenes thumbnails for “switch scene to” (image dropdown). */
export function setSwitchSceneImageDropdownExtras(
  getter: ImageExtrasGetter | null,
): void {
  sceneImageThumbExtrasGetter = getter;
}

export function getSwitchSceneDropdownOptions(): MenuOption[] {
  const catalog = sceneImageThumbOptions();
  const extras = sceneImageThumbExtrasGetter?.() ?? [];
  if (extras.length === 0) return catalog;
  return [...catalog, FieldDropdown.SEPARATOR, ...extras];
}

type TextExtrasGetter = () => [string, string][];

let sceneTextExtrasGetter: TextExtrasGetter | null = null;

/** Workspace sets My Scenes labels for “when scene switches to” (text dropdown). */
export function setSceneTextDropdownExtras(getter: TextExtrasGetter | null): void {
  sceneTextExtrasGetter = getter;
}

export function getSceneTextDropdownOptions(): [string, string][] {
  const base: [string, string][] = OLLIE_SCENES.map((s) => [s.label, s.id]);
  const extras = sceneTextExtrasGetter?.() ?? [];
  if (extras.length === 0) return base;
  return [...base, ...extras];
}
