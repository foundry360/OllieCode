/**
 * Stage scenes (backgrounds) and sprite costumes. Add files under
 * `public/images/backdrops/` and `public/images/sprites/`, then register here.
 */

export const OLLIE_SCENES = [
  {
    id: "white_grid",
    label: "White grid",
    kind: "solid" as const,
    rgb: [255, 255, 255] as const,
    grid: true,
  },
  {
    id: "sky",
    label: "Sky blue",
    kind: "solid" as const,
    rgb: [186, 230, 253] as const,
    grid: true,
  },
  {
    id: "mint",
    label: "Mint",
    kind: "solid" as const,
    rgb: [209, 250, 229] as const,
    grid: true,
  },
  {
    id: "park",
    label: "Park",
    kind: "image" as const,
    src: "/images/backdrops/park.svg",
    grid: false,
    fallbackRgb: [134, 239, 172] as const,
  },
] as const;

export const OLLIE_SPRITE_COSTUMES = [
  {
    id: "cat",
    label: "Ollie",
    kind: "image" as const,
    src: "/images/ollie.png",
    width: 88,
  },
  {
    id: "star",
    label: "Star",
    kind: "image" as const,
    src: "/images/sprites/star.svg",
    width: 56,
  },
  {
    id: "square",
    label: "Blue square",
    kind: "shape" as const,
    shape: "square" as const,
  },
  {
    id: "ball",
    label: "Pink ball",
    kind: "shape" as const,
    shape: "ball" as const,
  },
] as const;

export type OllieSceneId = (typeof OLLIE_SCENES)[number]["id"];
export type OllieSpriteCostumeId = (typeof OLLIE_SPRITE_COSTUMES)[number]["id"];

export type SceneDef = (typeof OLLIE_SCENES)[number];
export type CostumeDef = (typeof OLLIE_SPRITE_COSTUMES)[number];

export const DEFAULT_SCENE_ID: OllieSceneId = "white_grid";
export const DEFAULT_COSTUME_ID: OllieSpriteCostumeId = "cat";

export function getSceneById(id: string): SceneDef | undefined {
  return OLLIE_SCENES.find((b) => b.id === id);
}

export function getCostumeById(id: string): CostumeDef | undefined {
  return OLLIE_SPRITE_COSTUMES.find((c) => c.id === id);
}

export function sceneDropdownOptions(): [string, string][] {
  return OLLIE_SCENES.map((b) => [b.label, b.id]);
}

export function costumeDropdownOptions(): [string, string][] {
  return OLLIE_SPRITE_COSTUMES.map((c) => [c.label, c.id]);
}

export function isOllieSceneId(s: string): s is OllieSceneId {
  return OLLIE_SCENES.some((b) => b.id === s);
}

export function isOllieSpriteCostumeId(s: string): s is OllieSpriteCostumeId {
  return OLLIE_SPRITE_COSTUMES.some((c) => c.id === s);
}

export function collectStageImageUrls(): string[] {
  const urls = new Set<string>();
  for (const b of OLLIE_SCENES) {
    if (b.kind === "image") urls.add(b.src);
  }
  for (const c of OLLIE_SPRITE_COSTUMES) {
    if (c.kind === "image") urls.add(c.src);
  }
  return [...urls];
}
