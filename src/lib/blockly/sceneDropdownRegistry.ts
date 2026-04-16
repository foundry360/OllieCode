import type { ImageProperties, MenuOption } from "blockly/core";
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

export function getSwitchSceneDropdownOptions(): MenuOption[] {
  return sceneImageThumbOptions();
}
