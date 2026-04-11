/**
 * Stage scenes (backgrounds) and sprite costumes. Add files under
 * `public/images/backdrops/` and `public/images/sprites/`, then register here.
 */

/** Pixels within `threshold` of `rgb` (per channel) become transparent after load. */
export type CostumeChromaKey = {
  rgb: readonly [number, number, number];
  threshold?: number;
};

/** Sprite picker / library filters — each costume lists one or more. */
export const SPRITE_CATEGORY_IDS = [
  "characters",
  "animals",
  "robots_tech",
  "vehicles",
  "environment",
  "fantasy",
  "objects",
  "my_sprites",
] as const;
export type SpriteCategoryId = (typeof SPRITE_CATEGORY_IDS)[number];

export const SPRITE_CATEGORY_LABELS: Record<SpriteCategoryId, string> = {
  characters: "Characters",
  animals: "Animals",
  robots_tech: "Robots & Tech",
  vehicles: "Vehicles",
  environment: "Environment & Nature",
  fantasy: "Fantasy & Adventure",
  objects: "Objects",
  my_sprites: "My Sprites",
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
  {
    id: "bg01",
    label: "Park street & phone booth",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg01.png",
    grid: false,
    fallbackRgb: [152, 173, 155] as const,
  },
  {
    id: "bg02",
    label: "City park & lamp skyline",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg02.png",
    grid: false,
    fallbackRgb: [192, 200, 187] as const,
  },
  {
    id: "bg03",
    label: "Downtown gray street",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg03.png",
    grid: false,
    fallbackRgb: [188, 204, 208] as const,
  },
  {
    id: "bg04",
    label: "City street & sunbeams",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg04.png",
    grid: false,
    fallbackRgb: [100, 116, 94] as const,
  },
  {
    id: "bg05",
    label: "Mountain trail & meadow",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg05.png",
    grid: false,
    fallbackRgb: [147, 195, 182] as const,
  },
  {
    id: "bg06",
    label: "Jungle frame border",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg06.png",
    grid: false,
    fallbackRgb: [199, 211, 192] as const,
  },
  {
    id: "bg07",
    label: "Green meadow & forest",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg07.png",
    grid: false,
    fallbackRgb: [151, 191, 97] as const,
  },
  {
    id: "bg08",
    label: "Sand dunes",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg08.png",
    grid: false,
    fallbackRgb: [228, 180, 128] as const,
  },
  {
    id: "bg09",
    label: "Desert & cacti",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg09.png",
    grid: false,
    fallbackRgb: [210, 166, 123] as const,
  },
  {
    id: "bg10",
    label: "Dunes & cactus",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg10.png",
    grid: false,
    fallbackRgb: [243, 179, 123] as const,
  },
  {
    id: "bg11",
    label: "Underwater coral & light",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg11.png",
    grid: false,
    fallbackRgb: [114, 163, 193] as const,
  },
  {
    id: "bg12",
    label: "Coral reef frame",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg12.png",
    grid: false,
    fallbackRgb: [231, 221, 210] as const,
  },
  {
    id: "bg13",
    label: "Seafloor & seaweed",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg13.png",
    grid: false,
    fallbackRgb: [102, 175, 183] as const,
  },
  {
    id: "bg14",
    label: "Beach waves & shore",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg14.png",
    grid: false,
    fallbackRgb: [143, 197, 195] as const,
  },
  {
    id: "bg15",
    label: "Tropical beach & plane",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg15.png",
    grid: false,
    fallbackRgb: [145, 210, 206] as const,
  },
  {
    id: "bg16",
    label: "Underwater coral & bubbles",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg16.png",
    grid: false,
    fallbackRgb: [200, 214, 216] as const,
  },
  {
    id: "bg17",
    label: "Coral reef & bubbles",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg17.png",
    grid: false,
    fallbackRgb: [53, 112, 140] as const,
  },
  {
    id: "bg18",
    label: "Pipe utility corridor",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg18.png",
    grid: false,
    fallbackRgb: [73, 82, 98] as const,
  },
  {
    id: "bg19",
    label: "Office & city windows",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg19.png",
    grid: false,
    fallbackRgb: [144, 148, 159] as const,
  },
  {
    id: "bg20",
    label: "Town square & compass",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg20.png",
    grid: false,
    fallbackRgb: [190, 202, 193] as const,
  },
  {
    id: "bg21",
    label: "Classroom & chalkboard",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg21.png",
    grid: false,
    fallbackRgb: [206, 130, 111] as const,
  },
  {
    id: "bg22",
    label: "Checkerboard tunnel",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg22.png",
    grid: false,
    fallbackRgb: [118, 118, 118] as const,
  },
  {
    id: "bg23",
    label: "Theater stage (open)",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg23.png",
    grid: false,
    fallbackRgb: [238, 203, 193] as const,
  },
  {
    id: "bg24",
    label: "Theater stage (dark)",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg24.png",
    grid: false,
    fallbackRgb: [156, 71, 58] as const,
  },
  {
    id: "bg25",
    label: "Theater spotlight",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg25.png",
    grid: false,
    fallbackRgb: [145, 80, 64] as const,
  },
  {
    id: "bg26",
    label: "Festive marigold arch",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg26.png",
    grid: false,
    fallbackRgb: [222, 184, 142] as const,
  },
  {
    id: "bg27",
    label: "Theater & audience seats",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg27.png",
    grid: false,
    fallbackRgb: [91, 45, 71] as const,
  },
  {
    id: "bg28",
    label: "Classroom & desks",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg28.png",
    grid: false,
    fallbackRgb: [202, 189, 160] as const,
  },
  {
    id: "bg29",
    label: "Bedroom & tulips",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg29.png",
    grid: false,
    fallbackRgb: [235, 211, 183] as const,
  },
  {
    id: "bg30",
    label: "Cozy bedroom & lamp",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg30.png",
    grid: false,
    fallbackRgb: [225, 186, 165] as const,
  },
  {
    id: "bg31",
    label: "Minimal bedroom & clock",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg31.png",
    grid: false,
    fallbackRgb: [207, 183, 167] as const,
  },
  {
    id: "bg32",
    label: "Sunny bedroom & wardrobe",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg32.png",
    grid: false,
    fallbackRgb: [220, 174, 124] as const,
  },
  {
    id: "bg33",
    label: "Indoor basketball court",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg33.png",
    grid: false,
    fallbackRgb: [238, 225, 208] as const,
  },
  {
    id: "bg34",
    label: "Outdoor basketball court",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg34.png",
    grid: false,
    fallbackRgb: [162, 176, 159] as const,
  },
  {
    id: "bg35",
    label: "Gym basketball hoop",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg35.png",
    grid: false,
    fallbackRgb: [180, 160, 121] as const,
  },
  {
    id: "bg36",
    label: "Soccer field & buildings",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg36.png",
    grid: false,
    fallbackRgb: [141, 186, 163] as const,
  },
  {
    id: "bg37",
    label: "Deep space & nebula",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg37.png",
    grid: false,
    fallbackRgb: [15, 19, 25] as const,
  },
  {
    id: "bg38",
    label: "Starry night sky",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg38.png",
    grid: false,
    fallbackRgb: [7, 2, 65] as const,
  },
  {
    id: "bg39",
    label: "Purple nebula stars",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg39.png",
    grid: false,
    fallbackRgb: [57, 31, 117] as const,
  },
  {
    id: "bg40",
    label: "Starlit lake & village",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg40.png",
    grid: false,
    fallbackRgb: [44, 65, 116] as const,
  },
  {
    id: "bg41",
    label: "Moonlit ocean",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg41.png",
    grid: false,
    fallbackRgb: [53, 77, 116] as const,
  },
  {
    id: "bg42",
    label: "Sunny green hills",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg42.png",
    grid: false,
    fallbackRgb: [161, 209, 171] as const,
  },
  {
    id: "bg43",
    label: "Blue sky & clouds",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg43.png",
    grid: false,
    fallbackRgb: [120, 201, 216] as const,
  },
  {
    id: "bg44",
    label: "Dinosaur egg nest",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg44.png",
    grid: false,
    fallbackRgb: [144, 170, 128] as const,
  },
  {
    id: "bg45",
    label: "Prehistoric river & volcano",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg45.png",
    grid: false,
    fallbackRgb: [153, 184, 148] as const,
  },
  {
    id: "bg46",
    label: "Tropical volcano lagoon",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg46.png",
    grid: false,
    fallbackRgb: [131, 154, 87] as const,
  },
  {
    id: "bg47",
    label: "Palm river & mountains",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg47.png",
    grid: false,
    fallbackRgb: [137, 158, 150] as const,
  },
  {
    id: "bg48",
    label: "Sunset palms & desert",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg48.png",
    grid: false,
    fallbackRgb: [177, 144, 51] as const,
  },
  {
    id: "bg49",
    label: "Tropical island & peaks",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg49.png",
    grid: false,
    fallbackRgb: [123, 187, 163] as const,
  },
  {
    id: "bg50",
    label: "Party balloons",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg50.png",
    grid: false,
    fallbackRgb: [54, 142, 157] as const,
  },
  {
    id: "bg51",
    label: "City park & tree",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg51.png",
    grid: false,
    fallbackRgb: [188, 196, 158] as const,
  },
  {
    id: "bg52",
    label: "City sidewalk & buildings",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg52.png",
    grid: false,
    fallbackRgb: [174, 202, 204] as const,
  },
  {
    id: "bg53",
    label: "Mountain road & sunrise",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg53.png",
    grid: false,
    fallbackRgb: [164, 181, 177] as const,
  },
  {
    id: "bg54",
    label: "Cafe & theater street",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg54.png",
    grid: false,
    fallbackRgb: [155, 151, 149] as const,
  },
  {
    id: "bg55",
    label: "Savanna & blue mountain",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg55.png",
    grid: false,
    fallbackRgb: [125, 167, 161] as const,
  },
  {
    id: "bg56",
    label: "Park bench & bridge",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg56.png",
    grid: false,
    fallbackRgb: [138, 161, 137] as const,
  },
  {
    id: "bg57",
    label: "Climbing playground",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg57.png",
    grid: false,
    fallbackRgb: [193, 209, 176] as const,
  },
  {
    id: "bg58",
    label: "Playground slide tower",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg58.png",
    grid: false,
    fallbackRgb: [199, 173, 115] as const,
  },
  {
    id: "bg59",
    label: "Night village houses",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg59.png",
    grid: false,
    fallbackRgb: [92, 132, 154] as const,
  },
  {
    id: "bg60",
    label: "Backyard & picket fence",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg60.png",
    grid: false,
    fallbackRgb: [150, 177, 149] as const,
  },
  {
    id: "bg61",
    label: "Living room & hill view",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg61.png",
    grid: false,
    fallbackRgb: [217, 185, 161] as const,
  },
  {
    id: "bg62",
    label: "Living room (variant)",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg62.png",
    grid: false,
    fallbackRgb: [217, 185, 161] as const,
  },
  {
    id: "bg63",
    label: "Modern living room",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg63.png",
    grid: false,
    fallbackRgb: [188, 182, 170] as const,
  },
  {
    id: "bg64",
    label: "Glass sunroom",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg64.png",
    grid: false,
    fallbackRgb: [228, 214, 196] as const,
  },
  {
    id: "bg65",
    label: "Empty room & windows",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg65.png",
    grid: false,
    fallbackRgb: [231, 190, 123] as const,
  },
  {
    id: "bg66",
    label: "Pink curtains & clock",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg66.png",
    grid: false,
    fallbackRgb: [222, 197, 192] as const,
  },
  {
    id: "bg67",
    label: "Pond & cattails",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg67.png",
    grid: false,
    fallbackRgb: [151, 195, 184] as const,
  },
  {
    id: "bg68",
    label: "Jungle river & frog",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg68.png",
    grid: false,
    fallbackRgb: [96, 142, 107] as const,
  },
  {
    id: "bg69",
    label: "Reading nook & books",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg69.png",
    grid: false,
    fallbackRgb: [185, 181, 167] as const,
  },
  {
    id: "bg70",
    label: "Underwater reef silhouette",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg70.png",
    grid: false,
    fallbackRgb: [66, 181, 206] as const,
  },
  {
    id: "bg71",
    label: "Study alcove & magic book",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg71.png",
    grid: false,
    fallbackRgb: [80, 58, 44] as const,
  },
  {
    id: "bg72",
    label: "Canyon river",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg72.png",
    grid: false,
    fallbackRgb: [147, 107, 98] as const,
  },
  {
    id: "bg73",
    label: "Subway cockpit",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg73.png",
    grid: false,
    fallbackRgb: [70, 92, 110] as const,
  },
  {
    id: "bg74",
    label: "Airplane cockpit",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg74.png",
    grid: false,
    fallbackRgb: [117, 132, 180] as const,
  },
  {
    id: "bg75",
    label: "Earth from the Moon",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg75.png",
    grid: false,
    fallbackRgb: [38, 61, 85] as const,
  },
  {
    id: "bg76",
    label: "Moon surface & planets",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg76.png",
    grid: false,
    fallbackRgb: [138, 122, 133] as const,
  },
  {
    id: "bg77",
    label: "Dead tree wasteland",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg77.png",
    grid: false,
    fallbackRgb: [218, 204, 186] as const,
  },
  {
    id: "bg78",
    label: "Acacia savanna",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg78.png",
    grid: false,
    fallbackRgb: [181, 195, 139] as const,
  },
  {
    id: "bg79",
    label: "Acacia sunset",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg79.png",
    grid: false,
    fallbackRgb: [220, 184, 83] as const,
  },
  {
    id: "bg80",
    label: "Meadow & big clouds",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg80.png",
    grid: false,
    fallbackRgb: [120, 185, 189] as const,
  },
  {
    id: "bg81",
    label: "Meadow tree & daisies",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg81.png",
    grid: false,
    fallbackRgb: [164, 183, 87] as const,
  },
  {
    id: "bg82",
    label: "City night & lights",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg82.png",
    grid: false,
    fallbackRgb: [84, 93, 128] as const,
  },
  {
    id: "bg83",
    label: "Beach sunset & surfboard",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg83.png",
    grid: false,
    fallbackRgb: [195, 187, 153] as const,
  },
  {
    id: "bg84",
    label: "Beach chair & surfboards",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg84.png",
    grid: false,
    fallbackRgb: [171, 178, 128] as const,
  },
  {
    id: "bg85",
    label: "Wild West street",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg85.png",
    grid: false,
    fallbackRgb: [243, 194, 164] as const,
  },
  {
    id: "bg86",
    label: "Desert mesa & city",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg86.png",
    grid: false,
    fallbackRgb: [205, 167, 153] as const,
  },
  {
    id: "bg87",
    label: "Sky gradient",
    kind: "image" as const,
    src: "/images/backdrops/pack/bg87.png",
    grid: false,
    fallbackRgb: [154, 205, 249] as const,
  },
  {
    id: "winterforest",
    label: "Winter forest",
    kind: "image" as const,
    src: "/images/backdrops/misc/winterforest.png",
    grid: false,
    fallbackRgb: [158, 182, 206] as const,
  },
  {
    id: "christmasmarket",
    label: "Christmas market (night)",
    kind: "image" as const,
    src: "/images/backdrops/misc/christmasmarket.png",
    grid: false,
    fallbackRgb: [98, 92, 106] as const,
  },
  {
    id: "aurorawinterpath",
    label: "Aurora winter path",
    kind: "image" as const,
    src: "/images/backdrops/misc/aurorawinterpath.png",
    grid: false,
    fallbackRgb: [76, 112, 144] as const,
  },
  {
    id: "folkstarfloral",
    label: "Folk star & florals",
    kind: "image" as const,
    src: "/images/backdrops/misc/folkstarfloral.png",
    grid: false,
    fallbackRgb: [221, 223, 208] as const,
  },
  {
    id: "faithsymbolpattern",
    label: "Faith symbols pattern",
    kind: "image" as const,
    src: "/images/backdrops/misc/faithsymbolpattern.png",
    grid: false,
    fallbackRgb: [228, 218, 204] as const,
  },
  {
    id: "templemeditation",
    label: "Temple meditation",
    kind: "image" as const,
    src: "/images/backdrops/misc/templemeditation.png",
    grid: false,
    fallbackRgb: [213, 176, 136] as const,
  },
  {
    id: "mosquefacade",
    label: "Green dome mosque",
    kind: "image" as const,
    src: "/images/backdrops/misc/mosquefacade.png",
    grid: false,
    fallbackRgb: [208, 181, 151] as const,
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
    spriteCategories: ["robots_tech", "characters"] as const,
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
    spriteCategories: ["animals"] as const,
  },
  {
    id: "schoolbus",
    label: "School bus",
    kind: "image" as const,
    src: "/images/sprites/schoolbus.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "skaterboy",
    label: "Skater boy",
    kind: "image" as const,
    src: "/images/sprites/skaterboy.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "racingboy",
    label: "Racing boy",
    kind: "image" as const,
    src: "/images/sprites/racingboy.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "daveywalk",
    label: "Davey",
    kind: "image" as const,
    src: "/images/sprites/daveywalk.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "matilda",
    label: "Matilda",
    kind: "image" as const,
    src: "/images/sprites/matilda.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "professorproton",
    label: "Professor Proton",
    kind: "image" as const,
    src: "/images/sprites/professorproton.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
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
    spriteCategories: ["fantasy", "characters"] as const,
  },
  {
    id: "daisydragon",
    label: "Daisy Dragon",
    kind: "image" as const,
    src: "/images/sprites/daisydragon.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals", "fantasy"] as const,
  },
  {
    id: "knightsword",
    label: "Knight with sword",
    kind: "image" as const,
    src: "/images/sprites/knightsword.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    chromaKey: { rgb: [0, 0, 0] as const, threshold: 18 },
    spriteCategories: ["fantasy", "characters"] as const,
  },
  {
    id: "smilingsun",
    label: "Smiling Sun",
    kind: "image" as const,
    src: "/images/sprites/smilingsun.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["environment", "fantasy"] as const,
  },
  {
    id: "helicopter",
    label: "Helicopter",
    kind: "image" as const,
    src: "/images/sprites/helicopter.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "submarine",
    label: "Submarine",
    kind: "image" as const,
    src: "/images/sprites/submarine.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "karlcrab",
    label: "Karl Crab",
    kind: "image" as const,
    src: "/images/sprites/karlcrab.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals"] as const,
  },
  {
    id: "jerryjellyfish",
    label: "Jerry Jellyfish",
    kind: "image" as const,
    src: "/images/sprites/jerryjellyfish.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals"] as const,
  },
  {
    id: "ninjacat",
    label: "Ninja cat",
    kind: "image" as const,
    src: "/images/sprites/ninjacat.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals", "fantasy"] as const,
  },
  {
    id: "ninjaboy",
    label: "Ninja boy",
    kind: "image" as const,
    src: "/images/sprites/ninjaboy.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "princefrog",
    label: "Prince frog",
    kind: "image" as const,
    src: "/images/sprites/princefrog.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals", "fantasy"] as const,
  },
  {
    id: "wingedprincess",
    label: "Winged princess",
    kind: "image" as const,
    src: "/images/sprites/wingedprincess.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "mermaid",
    label: "Mermaid",
    kind: "image" as const,
    src: "/images/sprites/mermaid.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "horse",
    label: "Horse",
    kind: "image" as const,
    src: "/images/sprites/horse.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals"] as const,
  },
  {
    id: "cowboykid",
    label: "Cowboy kid",
    kind: "image" as const,
    src: "/images/sprites/cowboykid.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "cowboylasso",
    label: "Cowboy lasso",
    kind: "image" as const,
    src: "/images/sprites/cowboylasso.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "bandit",
    label: "Bandit",
    kind: "image" as const,
    src: "/images/sprites/bandit.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "cowgirl",
    label: "Cowgirl",
    kind: "image" as const,
    src: "/images/sprites/cowgirl.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "butterfly",
    label: "Butterfly",
    kind: "image" as const,
    src: "/images/sprites/butterfly.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals", "environment"] as const,
  },
  {
    id: "clock",
    label: "Clock",
    kind: "image" as const,
    src: "/images/sprites/clock.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "alarm",
    label: "Alarm clock",
    kind: "image" as const,
    src: "/images/sprites/alarm.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "fan",
    label: "Fan",
    kind: "image" as const,
    src: "/images/sprites/fan.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "birthdaycake",
    label: "Birthday cake",
    kind: "image" as const,
    src: "/images/sprites/birthdaycake.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "happyapple",
    label: "Happy apple",
    kind: "image" as const,
    src: "/images/sprites/happyapple.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects", "fantasy"] as const,
  },
  {
    id: "dancingbaby",
    label: "Dancing baby",
    kind: "image" as const,
    src: "/images/sprites/dancingbaby.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "trumpet",
    label: "Trumpet",
    kind: "image" as const,
    src: "/images/sprites/trumpet.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "magicwand",
    label: "Magic wand",
    kind: "image" as const,
    src: "/images/sprites/magicwand.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "firetruck",
    label: "Fire truck",
    kind: "image" as const,
    src: "/images/sprites/firetruck.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "policecar",
    label: "Police car",
    kind: "image" as const,
    src: "/images/sprites/policecar.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "steamtrain",
    label: "Steam train",
    kind: "image" as const,
    src: "/images/sprites/steamtrain.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "ambulance",
    label: "Ambulance",
    kind: "image" as const,
    src: "/images/sprites/ambulance.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "airplane",
    label: "Airplane",
    kind: "image" as const,
    src: "/images/sprites/airplane.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "racecar",
    label: "Race car",
    kind: "image" as const,
    src: "/images/sprites/racecar.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "rocketship",
    label: "Rocket ship",
    kind: "image" as const,
    src: "/images/sprites/rocketship.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles"] as const,
  },
  {
    id: "armytank",
    label: "Army tank",
    kind: "image" as const,
    src: "/images/sprites/armytank.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    /**
     * First two rows tilt the barrel above hull “forward” (+X); rotation aligns hull to the
     * pointer, so the gun looked aimed high. Later rows keep the barrel level with +X.
     */
    defaultSheetFrame: 10,
    spriteCategories: ["vehicles"] as const,
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
    spriteCategories: ["animals"] as const,
  },
  {
    id: "dori",
    label: "Dori",
    kind: "image" as const,
    src: "/images/sprites/dori.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals"] as const,
  },
  {
    id: "hootie",
    label: "Hootie",
    kind: "image" as const,
    src: "/images/sprites/hootie.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["animals"] as const,
  },
  {
    id: "cyclops",
    label: "Cyclops",
    kind: "image" as const,
    src: "/images/sprites/cyclops.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters", "fantasy"] as const,
  },
  {
    id: "arnold",
    label: "Arnold",
    kind: "image" as const,
    src: "/images/sprites/arnold.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "jasper",
    label: "Jasper",
    kind: "image" as const,
    src: "/images/sprites/jasper.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "jasperwalk",
    label: "Jasper (walk)",
    kind: "image" as const,
    src: "/images/sprites/jasperwalk.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "flyingsaucer",
    label: "Flying saucer",
    kind: "image" as const,
    src: "/images/sprites/flyingsaucer.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["vehicles", "fantasy"] as const,
  },
  {
    id: "vulcano",
    label: "Vulcano",
    kind: "image" as const,
    src: "/images/sprites/vulcano.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["environment", "fantasy"] as const,
  },
  {
    id: "treasurechest",
    label: "Treasure chest",
    kind: "image" as const,
    src: "/images/sprites/treasurechest.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects", "fantasy"] as const,
  },
  {
    id: "smilingcomputer",
    label: "Smiling computer",
    kind: "image" as const,
    src: "/images/sprites/smilingcomputer.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["robots_tech", "objects"] as const,
  },
  {
    id: "bouncingrubberball",
    label: "Bouncing rubber ball",
    kind: "image" as const,
    src: "/images/sprites/bouncingrubberball.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "basketball",
    label: "Basketball",
    kind: "image" as const,
    src: "/images/sprites/basketball.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "soccer",
    label: "Soccer",
    kind: "image" as const,
    src: "/images/sprites/soccer.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "beachball",
    label: "Beach ball",
    kind: "image" as const,
    src: "/images/sprites/beachball.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "electricguitar",
    label: "Electric guitar",
    kind: "image" as const,
    src: "/images/sprites/electricguitar.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["objects"] as const,
  },
  {
    id: "dancinggirl",
    label: "Dancing girl",
    kind: "image" as const,
    src: "/images/sprites/dancinggirl.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "girlrunning",
    label: "Running girl",
    kind: "image" as const,
    src: "/images/sprites/girlrunning.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "girlexercising",
    label: "Girl exercising",
    kind: "image" as const,
    src: "/images/sprites/girlexercising.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "karategirl",
    label: "Karate girl",
    kind: "image" as const,
    src: "/images/sprites/karategirl.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["characters"] as const,
  },
  {
    id: "cloud",
    label: "Cloud",
    kind: "image" as const,
    src: "/images/sprites/cloud.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["environment"] as const,
  },
  {
    id: "earthy",
    label: "Earthy",
    kind: "image" as const,
    src: "/images/sprites/earthy.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["environment", "fantasy"] as const,
  },
  {
    id: "moon",
    label: "Moon",
    kind: "image" as const,
    src: "/images/sprites/moon.png",
    width: 200,
    spriteSheet: { columns: 5, rows: 5 },
    spriteRotationOffsetDeg: -90,
    spriteCategories: ["environment", "fantasy"] as const,
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

/**
 * Initial sprite-sheet cell when switching to this costume (default 0). Used when art’s
 * “rest” frame should not be cell 0 (e.g. army tank barrel level with hull on later rows).
 */
export function defaultSheetFrameForCostumeId(id: string): number {
  const def = getCostumeById(id);
  if (!def || def.kind !== "image" || !def.spriteSheet) return 0;
  const n = Math.max(
    1,
    def.spriteSheet.columns * def.spriteSheet.rows,
  );
  const raw =
    "defaultSheetFrame" in def &&
    typeof (def as { defaultSheetFrame?: number }).defaultSheetFrame ===
      "number"
      ? (def as { defaultSheetFrame: number }).defaultSheetFrame
      : 0;
  return Math.max(0, Math.min(n - 1, Math.floor(raw)));
}

/**
 * Scratch keeps the rotation anchor at the costume center, but side-view art has the nose /
 * barrel forward of center. “Point toward” uses this offset (px along current heading) so the
 * aim line runs from the visible front toward the pointer. Optional per-costume
 * `pointTowardsOriginForwardPx` overrides the default (~14% of costume width); use `0` for center.
 */
export function pointTowardsForwardOffsetPxForCostumeId(id: string): number {
  const def = getCostumeById(id) ?? getCostumeById(DEFAULT_COSTUME_ID);
  if (!def || def.kind !== "image") return 0;
  const d = def as {
    pointTowardsOriginForwardPx?: number;
    width?: number;
  };
  if (typeof d.pointTowardsOriginForwardPx === "number") {
    return Math.max(0, d.pointTowardsOriginForwardPx);
  }
  const w = typeof d.width === "number" ? d.width : 200;
  return Math.max(0, Math.round(w * 0.14));
}

/** Whether a catalog costume appears in the sprite picker for the given filter. */
export function spriteCostumeMatchesCategory(
  costumeId: OllieSpriteCostumeId,
  filter: SpriteCategoryId | "all",
): boolean {
  if (filter === "all") return true;
  if (filter === "my_sprites") return false;
  const c = getCostumeById(costumeId);
  if (!c || c.kind !== "image" || !("spriteCategories" in c)) return false;
  return (c.spriteCategories as readonly SpriteCategoryId[]).includes(filter);
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

/** Next scene in {@link OLLIE_SCENES} order (wraps). */
export function nextOllieSceneId(current: OllieSceneId): OllieSceneId {
  const i = OLLIE_SCENES.findIndex((s) => s.id === current);
  const idx = i < 0 ? 0 : (i + 1) % OLLIE_SCENES.length;
  return OLLIE_SCENES[idx].id;
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
  ["racingboy"],
  ["daveywalk"],
  ["matilda"],
  ["professorproton"],
  ["gandorthewizard"],
  ["daisydragon"],
  ["knightsword"],
  ["smilingsun"],
  ["helicopter"],
  ["submarine"],
  ["karlcrab"],
  ["jerryjellyfish"],
  ["ninjacat"],
  ["ninjaboy"],
  ["princefrog"],
  ["wingedprincess"],
  ["mermaid"],
  ["horse"],
  ["cowboykid"],
  ["cowboylasso"],
  ["bandit"],
  ["cowgirl"],
  ["butterfly"],
  ["clock"],
  ["alarm"],
  ["fan"],
  ["birthdaycake"],
  ["happyapple"],
  ["dancingbaby"],
  ["trumpet"],
  ["magicwand"],
  ["firetruck"],
  ["policecar"],
  ["steamtrain"],
  ["ambulance"],
  ["airplane"],
  ["racecar"],
  ["rocketship"],
  ["armytank"],
  ["murry"],
  ["dori"],
  ["hootie"],
  ["cyclops"],
  ["arnold"],
  ["jasper", "jasperwalk"],
  ["flyingsaucer"],
  ["vulcano"],
  ["treasurechest"],
  ["smilingcomputer"],
  ["bouncingrubberball"],
  ["basketball"],
  ["soccer"],
  ["beachball"],
  ["electricguitar"],
  ["dancinggirl"],
  ["girlrunning"],
  ["girlexercising"],
  ["karategirl"],
  ["cloud"],
  ["earthy"],
  ["moon"],
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
  { costumeId: "racingboy", label: "Racing boy" },
  { costumeId: "daveywalk", label: "Davey" },
  { costumeId: "matilda", label: "Matilda" },
  { costumeId: "professorproton", label: "Professor Proton" },
  { costumeId: "gandorthewizard", label: "Gandor the Wizard" },
  { costumeId: "daisydragon", label: "Daisy Dragon" },
  { costumeId: "knightsword", label: "Knight with sword" },
  { costumeId: "smilingsun", label: "Smiling Sun" },
  { costumeId: "helicopter", label: "Helicopter" },
  { costumeId: "submarine", label: "Submarine" },
  { costumeId: "karlcrab", label: "Karl Crab" },
  { costumeId: "jerryjellyfish", label: "Jerry Jellyfish" },
  { costumeId: "ninjacat", label: "Ninja cat" },
  { costumeId: "ninjaboy", label: "Ninja boy" },
  { costumeId: "princefrog", label: "Prince frog" },
  { costumeId: "wingedprincess", label: "Winged princess" },
  { costumeId: "mermaid", label: "Mermaid" },
  { costumeId: "horse", label: "Horse" },
  { costumeId: "cowboykid", label: "Cowboy kid" },
  { costumeId: "cowboylasso", label: "Cowboy lasso" },
  { costumeId: "bandit", label: "Bandit" },
  { costumeId: "cowgirl", label: "Cowgirl" },
  { costumeId: "butterfly", label: "Butterfly" },
  { costumeId: "clock", label: "Clock" },
  { costumeId: "alarm", label: "Alarm clock" },
  { costumeId: "fan", label: "Fan" },
  { costumeId: "birthdaycake", label: "Birthday cake" },
  { costumeId: "happyapple", label: "Happy apple" },
  { costumeId: "dancingbaby", label: "Dancing baby" },
  { costumeId: "trumpet", label: "Trumpet" },
  { costumeId: "magicwand", label: "Magic wand" },
  { costumeId: "firetruck", label: "Fire truck" },
  { costumeId: "policecar", label: "Police car" },
  { costumeId: "steamtrain", label: "Steam train" },
  { costumeId: "ambulance", label: "Ambulance" },
  { costumeId: "airplane", label: "Airplane" },
  { costumeId: "racecar", label: "Race car" },
  { costumeId: "rocketship", label: "Rocket ship" },
  { costumeId: "armytank", label: "Army tank" },
  { costumeId: "murry", label: "Murry" },
  { costumeId: "dori", label: "Dori" },
  { costumeId: "hootie", label: "Hootie" },
  { costumeId: "cyclops", label: "Cyclops" },
  { costumeId: "arnold", label: "Arnold" },
  { costumeId: "jasper", label: "Jasper" },
  { costumeId: "flyingsaucer", label: "Flying saucer" },
  { costumeId: "vulcano", label: "Vulcano" },
  { costumeId: "treasurechest", label: "Treasure chest" },
  { costumeId: "smilingcomputer", label: "Smiling computer" },
  { costumeId: "bouncingrubberball", label: "Bouncing rubber ball" },
  { costumeId: "basketball", label: "Basketball" },
  { costumeId: "soccer", label: "Soccer" },
  { costumeId: "beachball", label: "Beach ball" },
  { costumeId: "electricguitar", label: "Electric guitar" },
  { costumeId: "dancinggirl", label: "Dancing girl" },
  { costumeId: "girlrunning", label: "Running girl" },
  { costumeId: "girlexercising", label: "Girl exercising" },
  { costumeId: "karategirl", label: "Karate girl" },
  { costumeId: "cloud", label: "Cloud" },
  { costumeId: "earthy", label: "Earthy" },
  { costumeId: "moon", label: "Moon" },
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
