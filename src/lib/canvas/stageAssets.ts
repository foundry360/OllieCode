/**
 * Stage scenes (backgrounds) and sprite costumes. Add files under
 * `public/images/backdrops/` and `public/images/sprites/`, then register here.
 */

/** Pixels within `threshold` of `rgb` (per channel) become transparent after load. */
export type CostumeChromaKey = {
  rgb: readonly [number, number, number];
  threshold?: number;
};

export const OLLIE_SCENES = [
  {
    id: "white_dots",
    label: "White dots",
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
  {
    id: "path",
    label: "Path",
    kind: "image" as const,
    src: "/images/backdrops/path.png",
    grid: false,
    fallbackRgb: [220, 230, 210] as const,
  },
  {
    id: "pathway",
    label: "Pathway",
    kind: "image" as const,
    src: "/images/backdrops/pathway.png",
    grid: false,
    fallbackRgb: [210, 220, 200] as const,
  },
  {
    id: "cityroad",
    label: "City road",
    kind: "image" as const,
    src: "/images/backdrops/cityroad.png",
    grid: false,
    fallbackRgb: [180, 190, 200] as const,
  },
] as const;

export const OLLIE_SPRITE_COSTUMES = [
  {
    id: "olliebot",
    label: "Ollie Bot",
    kind: "image" as const,
    src: "/images/sprites/olliebot.png",
    width: 200,
    /** 1280×1280 texture: 5×5 walk cycle, left→right then next row. */
    spriteSheet: { columns: 5, rows: 5 },
    /**
     * Bitmap faces right at 0°; Scratch headings use 0° = toward stage top.
     * Applied in P5Canvas only (movement trig unchanged). Default sprite heading
     * is 90° so the rest pose faces right (like Scratch’s default). Facing left
     * uses horizontal mirror so the walk cycle stays upright (not 180° spin).
     */
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "dino",
    label: "Dino",
    kind: "image" as const,
    src: "/images/sprites/dino.png",
    width: 200,
    /** Same layout as Ollie Bot: 5×5 walk cycle on a square sheet. */
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "schoolbus",
    label: "School bus",
    kind: "image" as const,
    src: "/images/sprites/schoolbus.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "skaterboy",
    label: "Skater boy",
    kind: "image" as const,
    src: "/images/sprites/skaterboy.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "daveywalk",
    label: "Davey",
    kind: "image" as const,
    src: "/images/sprites/daveywalk.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "matilda",
    label: "Matilda",
    kind: "image" as const,
    src: "/images/sprites/matilda.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "professorproton",
    label: "Professor Proton",
    kind: "image" as const,
    src: "/images/sprites/professorproton.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "gandorthewizard",
    label: "Gandor the Wizard",
    kind: "image" as const,
    src: "/images/sprites/gandorthewizard.png",
    width: 200,
    /** 5×5 staff animation cycle on a square sheet. */
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "daisydragon",
    label: "Daisy Dragon",
    kind: "image" as const,
    src: "/images/sprites/daisydragon.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "smilingsun",
    label: "Smiling Sun",
    kind: "image" as const,
    src: "/images/sprites/smilingsun.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "helicopter",
    label: "Helicopter",
    kind: "image" as const,
    src: "/images/sprites/helicopter.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "submarine",
    label: "Submarine",
    kind: "image" as const,
    src: "/images/sprites/submarine.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "karlcrab",
    label: "Karl Crab",
    kind: "image" as const,
    src: "/images/sprites/karlcrab.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "jerryjellyfish",
    label: "Jerry Jellyfish",
    kind: "image" as const,
    src: "/images/sprites/jerryjellyfish.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
  {
    id: "murry",
    label: "Murry",
    kind: "image" as const,
    src: "/images/sprites/murry.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    /** Source art uses solid black; runtime makes it transparent on stage and in previews. */
    chromaKey: { rgb: [0, 0, 0] as const, threshold: 18 },
  },
  {
    id: "dori",
    label: "Dori",
    kind: "image" as const,
    src: "/images/sprites/dori.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
  },
] as const;

export type OllieSceneId = (typeof OLLIE_SCENES)[number]["id"];
export type OllieSpriteCostumeId = (typeof OLLIE_SPRITE_COSTUMES)[number]["id"];

export type SceneDef = (typeof OLLIE_SCENES)[number];
export type CostumeDef = (typeof OLLIE_SPRITE_COSTUMES)[number];

export const DEFAULT_SCENE_ID: OllieSceneId = "white_dots";
/** Default costume for new sprites and legacy saves that used removed walk frames. */
export const DEFAULT_COSTUME_ID: OllieSpriteCostumeId = "olliebot";

export function getSceneById(id: string): SceneDef | undefined {
  const canonical = id === "white_grid" ? "white_dots" : id;
  return OLLIE_SCENES.find((b) => b.id === canonical);
}

/** Normalize scene id from saved projects (legacy ids). */
export function migrateSceneIdFromStorage(
  id: string | undefined | null,
): OllieSceneId {
  if (id === "white_grid") return "white_dots";
  if (id && isOllieSceneId(id)) return id;
  return DEFAULT_SCENE_ID;
}

/**
 * Backdrop stack for the stage (bottom → top). Legacy saves only had `sceneId`.
 */
export function normalizeSceneLayerIdsFromPayload(
  sceneLayerIds: unknown,
  sceneId: unknown,
): OllieSceneId[] {
  if (Array.isArray(sceneLayerIds)) {
    const out: OllieSceneId[] = [];
    for (const x of sceneLayerIds) {
      if (typeof x === "string" && isOllieSceneId(x)) out.push(x);
    }
    if (out.length > 0) return out;
  }
  return [migrateSceneIdFromStorage(typeof sceneId === "string" ? sceneId : undefined)];
}

export function getCostumeById(id: string): CostumeDef | undefined {
  return OLLIE_SPRITE_COSTUMES.find((c) => c.id === id);
}

export function getChromaKeyForSpriteSrc(src: string): CostumeChromaKey | undefined {
  for (const c of OLLIE_SPRITE_COSTUMES) {
    if (c.kind !== "image" || c.src !== src) continue;
    if ("chromaKey" in c && c.chromaKey) return c.chromaKey;
  }
  return undefined;
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

const LEGACY_COSTUME_IDS = new Set([
  "bot1",
  "bot2",
  "bot3",
  "bot4",
  "backpack",
  "cat",
  "robot",
  "star",
  "square",
  "ball",
  /** Removed test costume — old saves migrate to default. */
  "fatbird",
]);

export function isLegacyOrCatalogCostumeId(id: string): boolean {
  return isOllieSpriteCostumeId(id) || LEGACY_COSTUME_IDS.has(id);
}

/** Map removed costume ids (e.g. old walk frames) and unknown ids to a valid catalog entry. */
export function migrateCostumeIdFromStorage(
  id: string | undefined | null,
): OllieSpriteCostumeId {
  if (id && LEGACY_COSTUME_IDS.has(id)) return "olliebot";
  if (id && isOllieSpriteCostumeId(id)) return id;
  return DEFAULT_COSTUME_ID;
}

/**
 * Resolve Blockly “switch costume” field values (id, legacy id, or human label from old XML).
 */
export function resolveCostumeFieldForExecution(
  raw: string | undefined | null,
): OllieSpriteCostumeId | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  if (isOllieSpriteCostumeId(s)) return s;
  if (LEGACY_COSTUME_IDS.has(s)) return migrateCostumeIdFromStorage(s);
  const lower = s.toLowerCase();
  const byLabel = OLLIE_SPRITE_COSTUMES.find(
    (c) => c.label.toLowerCase() === lower,
  );
  if (byLabel) return byLabel.id;
  if (lower === "blue square" || lower === "pink ball") return DEFAULT_COSTUME_ID;
  return undefined;
}

/**
 * Per-character “next costume” groups. For Ollie Bot (sprite sheet), the runtime advances
 * sheet frames instead of changing `costumeId` (see `P5Canvas` nextCostume).
 */
export const OLLIE_COSTUME_CYCLE_GROUPS: readonly OllieSpriteCostumeId[][] = [
  ["olliebot"],
  ["dino"],
  ["schoolbus"],
  ["skaterboy"],
  ["daveywalk"],
  ["matilda"],
  ["professorproton"],
  ["gandorthewizard"],
  ["daisydragon"],
  ["smilingsun"],
  ["helicopter"],
  ["submarine"],
  ["karlcrab"],
  ["jerryjellyfish"],
  ["murry"],
  ["dori"],
];

/**
 * Choose sprite modal: one row per character, not every costume (e.g. not all four walk frames).
 * `costumeId` is the default costume applied when that row is chosen.
 */
export const OLLIE_SPRITE_PICKER_ENTRIES: readonly {
  costumeId: OllieSpriteCostumeId;
  label: string;
}[] = [
  { costumeId: "olliebot", label: "Ollie Bot" },
  { costumeId: "dino", label: "Dino" },
  { costumeId: "schoolbus", label: "School bus" },
  { costumeId: "skaterboy", label: "Skater boy" },
  { costumeId: "daveywalk", label: "Davey" },
  { costumeId: "matilda", label: "Matilda" },
  { costumeId: "professorproton", label: "Professor Proton" },
  { costumeId: "gandorthewizard", label: "Gandor the Wizard" },
  { costumeId: "daisydragon", label: "Daisy Dragon" },
  { costumeId: "smilingsun", label: "Smiling Sun" },
  { costumeId: "helicopter", label: "Helicopter" },
  { costumeId: "submarine", label: "Submarine" },
  { costumeId: "karlcrab", label: "Karl Crab" },
  { costumeId: "jerryjellyfish", label: "Jerry Jellyfish" },
  { costumeId: "murry", label: "Murry" },
  { costumeId: "dori", label: "Dori" },
];

/** True if the sprite’s current costume belongs to the same picker row (e.g. same cycle group). */
export function isSpritePickerEntrySelected(
  entryCostumeId: OllieSpriteCostumeId,
  currentCostumeId: OllieSpriteCostumeId | null,
): boolean {
  if (currentCostumeId == null) return false;
  if (entryCostumeId === currentCostumeId) return true;
  for (const group of OLLIE_COSTUME_CYCLE_GROUPS) {
    if (group.includes(entryCostumeId) && group.includes(currentCostumeId)) {
      return true;
    }
  }
  return false;
}

/** Scratch-style “next costume” — cycles within a {@link OLLIE_COSTUME_CYCLE_GROUPS} row, else full catalog. */
export function nextOllieSpriteCostumeId(
  current: OllieSpriteCostumeId,
): OllieSpriteCostumeId {
  for (const group of OLLIE_COSTUME_CYCLE_GROUPS) {
    const i = group.indexOf(current);
    if (i >= 0) return group[(i + 1) % group.length]!;
  }
  const ids = OLLIE_SPRITE_COSTUMES.map((c) => c.id) as OllieSpriteCostumeId[];
  const i = ids.indexOf(current);
  const next = i >= 0 ? (i + 1) % ids.length : 0;
  return ids[next]!;
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
