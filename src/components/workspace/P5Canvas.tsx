"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type p5Types from "p5";
import type { OllieAction, SpriteScriptPlan } from "@/types/ollie";
import {
  assignRunVar,
  evalSerializedBool,
  evalSerializedNum,
  evalSerializedString,
  readVarValue,
  type SensingEvalContext,
} from "@/lib/blockly/sensingSerialize";
import {
  applyCostumeChromaKeyToCanvas,
  canvasToPngDataUrl,
  loadImageElement,
} from "@/lib/canvas/spriteChromaKey";
import {
  DEFAULT_COSTUME_ID,
  DEFAULT_SCENE_ID,
  collectStageImageUrls,
  defaultSheetFrameForCostumeId,
  getChromaKeyForSpriteSrc,
  getCostumeById,
  getSceneById,
  migrateCostumeIdFromStorage,
  nextOllieSceneId,
  nextOllieSpriteCostumeId,
  normalizeSceneLayerIdsFromPayload,
  pointTowardsForwardOffsetPxForCostumeId,
} from "@/lib/canvas/stageAssets";
import {
  PAINTED_COSTUME_FIT_BOX_PX,
  paintedCostumeFitInBox,
} from "@/lib/canvas/actorCostumeDisplay";
import { nonTransparentPixelBounds } from "@/lib/canvas/paintedCostumeBounds";
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import type { PointTowardsAimOrigin, StageActor } from "@/types/ollie";
import { playOllieSound, stopOllieSounds } from "@/lib/sounds/ollieSounds";

export type StageActorPaint = {
  id: string;
  costumeId: OllieSpriteCostumeId;
  /** Supabase (or other) URL for user-painted costume bitmap. */
  paintedCostumeUrl?: string;
  pointTowardsAimOrigin?: PointTowardsAimOrigin;
  pointTowardsForwardPx?: number;
  pointTowardsLateralPx?: number;
  pointTowardsLateralPct?: number;
};

export type P5CanvasHandle = {
  /** Run green-flag scripts, then keep key / stage / backdrop / broadcast handlers until the next run. */
  runProjectPlans: (
    plans: { spriteId: string; plan: SpriteScriptPlan }[],
  ) => Promise<{ aborted: boolean }>;
  /** Request an immediate stop of in-flight scripts (same effect as the “stop all” block). */
  stopRun: () => void;
  resetSprite: () => void;
  /**
   * Stop sounds, clear key / stage / backdrop session hooks from the last Run, and reset
   * sprites on the stage so the next Run starts from the same visual state as the first Run.
   */
  resetRunToBeginning: () => void;
};

export type P5CanvasProps = {
  className?: string;
  /** Backdrop layers (bottom → top). At least one id. */
  sceneLayerIds: OllieSceneId[];
  actors: StageActorPaint[];
  /**
   * While true, do not push `actors[].costumeId` into the runtime sprite map.
   * Avoids React re-renders overwriting costumes set mid-run before `onActorCostumeChange` state lands.
   */
  pauseActorCostumePropSync?: boolean;
  onSceneChange: (id: OllieSceneId) => void;
  onActorCostumeChange: (
    actorId: string,
    costumeId: OllieSpriteCostumeId,
    /** When set, show this user-painted image (from “switch costume” → My Sprite). */
    paintedUrl?: string,
  ) => void;
  /** Persist “point toward” aim origin when a script runs `setPointTowardAim`. */
  onActorPointTowardAimChange?: (
    actorId: string,
    patch: Pick<
      StageActor,
      | "pointTowardsAimOrigin"
      | "pointTowardsForwardPx"
      | "pointTowardsLateralPx"
      | "pointTowardsLateralPct"
    >,
  ) => void;
  /**
   * When set, `ask` / number prompts use this instead of `window.prompt`
   * (e.g. in-app modal over the stage).
   */
  requestNumberInput?: (
    message: string,
    numberOnly: boolean,
  ) => Promise<number>;
};

type Sprite = {
  x: number;
  y: number;
  heading: number;
  costume: OllieSpriteCostumeId;
  /** When set, draw this image URL instead of the catalog costume bitmap. */
  paintedCostumeSrc?: string;
  /** Frame index for image costumes with `spriteSheet` (walk/run advances this). */
  sheetFrame: number;
  /** Scratch-style display size; 100 = default draw scale. */
  sizePct: number;
  /** When false, sprite (and its bubble) are not drawn. */
  visible: boolean;
  /** Runtime clones only — used by “delete this clone”. */
  isClone?: boolean;
  bubble?: { text: string; kind: "say" | "think"; until: number };
  pointTowardsAimOrigin?: PointTowardsAimOrigin;
  pointTowardsForwardPx?: number;
  pointTowardsLateralPx?: number;
  pointTowardsLateralPct?: number;
};

/** Matches {@link drawSpriteForCostume} scale — aim offsets must be in stage px after scaling. */
function spriteSizeScale(s: Sprite): number {
  const raw = s.sizePct ?? 100;
  return Math.max(
    MIN_SPRITE_SIZE_PCT / 100,
    Math.min(MAX_SPRITE_SIZE_PCT / 100, raw / 100),
  );
}

function costumeHalfWidthPxForAim(s: Sprite): number {
  const painted = s.paintedCostumeSrc?.trim();
  if (painted) return PAINTED_COSTUME_FIT_BOX_PX / 2;
  const def =
    getCostumeById(s.costume) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  const w =
    def.kind === "image" && typeof (def as { width?: number }).width === "number"
      ? (def as { width: number }).width
      : 200;
  return w / 2;
}

function resolvePointTowardFwdLat(s: Sprite): { fwd: number; lat: number } {
  const sc = spriteSizeScale(s);
  /** Center pivot → pointer; use `catalog` or `custom` only when the learner opts in. */
  const mode = s.pointTowardsAimOrigin ?? "center";
  if (mode === "center") return { fwd: 0, lat: 0 };
  if (mode === "custom") {
    const fwd =
      (typeof s.pointTowardsForwardPx === "number"
        ? s.pointTowardsForwardPx
        : 0) * sc;
    let lat: number;
    if (typeof s.pointTowardsLateralPct === "number") {
      const halfW = costumeHalfWidthPxForAim(s);
      lat = (s.pointTowardsLateralPct / 100) * halfW * sc;
    } else {
      lat =
        (typeof s.pointTowardsLateralPx === "number"
          ? s.pointTowardsLateralPx
          : 0) * sc;
    }
    return { fwd, lat };
  }
  const painted = s.paintedCostumeSrc?.trim();
  const fwd = painted
    ? Math.round(PAINTED_COSTUME_FIT_BOX_PX * 0.14)
    : pointTowardsForwardOffsetPxForCostumeId(s.costume);
  return { fwd: fwd * sc, lat: 0 };
}

const MOVE_FRAMES = 18;
const CANVAS_MAX_PX = 4096;
/** Scratch-style size % — clamped when changing with grow/shrink blocks. */
const MIN_SPRITE_SIZE_PCT = 5;
const MAX_SPRITE_SIZE_PCT = 500;
/** Cap for `repeat` when count comes from variables / runtime math. */
const MAX_REPEAT_DYNAMIC_ITER = 2_000;
/** Cap for `while` / `until` with live conditions. */
const MAX_DYNAMIC_WHILE_ITER = 10_000;

/**
 * Use capture so Run key handlers run before Blockly (which otherwise consumes arrow keys
 * for workspace navigation while the editor is focused).
 */
const KEY_LISTENER_CAPTURE = true;

/** Scratch-style “face right” at rest; pairs with {@link CostumeDef} `spriteRotationOffsetDeg` for Ollie Bot. */
const DEFAULT_SPRITE_HEADING_DEG = 90;

/**
 * p5 `loadImage` often leaves SVGs with `width === 0`, which triggers the green
 * triangle fallback in `drawSpriteForCostume`. Rasterize via DOM Image + Graphics.
 */
async function loadSvgOrRasterViaDom(
  p: p5Types,
  url: string,
): Promise<p5Types.Image | null> {
  return new Promise((resolve) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => {
      const w = Math.max(1, el.naturalWidth || el.width);
      const h = Math.max(1, el.naturalHeight || el.height);
      const g = p.createGraphics(w, h);
      g.pixelDensity(1);
      const ctx = g.drawingContext as CanvasRenderingContext2D;
      ctx.drawImage(el, 0, 0, w, h);
      const pimg = g.get(0, 0, w, h);
      g.remove();
      resolve(pimg.width > 0 ? pimg : null);
    };
    el.onerror = () => resolve(null);
    el.src = url;
  });
}

async function maybeApplyChromaKey(
  p: p5Types,
  url: string,
  img: p5Types.Image,
): Promise<p5Types.Image> {
  const key = getChromaKeyForSpriteSrc(url);
  if (!key || !img.width) return img;
  /**
   * p5’s internal `img.elt` is not always a valid `CanvasImageSource` for
   * `drawImage` (p5 v2). Decode the same URL with `Image()` for chroma keying.
   */
  const domImg = await loadImageElement(url);
  if (!domImg || domImg.naturalWidth === 0) return img;
  const w = domImg.naturalWidth;
  const h = domImg.naturalHeight;
  const c = applyCostumeChromaKeyToCanvas(domImg, w, h, key);
  const dataUrl = canvasToPngDataUrl(c);
  const next = await p.loadImage(dataUrl);
  return next && next.width > 0 ? next : img;
}

async function loadStageImage(
  p: p5Types,
  url: string,
  stageImages: Map<string, p5Types.Image>,
) {
  try {
    const img = await p.loadImage(url);
    if (img && img.width > 0) {
      stageImages.set(url, await maybeApplyChromaKey(p, url, img));
      return;
    }
  } catch {
    /* try DOM path */
  }
  const fallback = await loadSvgOrRasterViaDom(p, url);
  if (fallback) {
    stageImages.set(url, await maybeApplyChromaKey(p, url, fallback));
  }
}

/**
 * Same as {@link loadSvgOrRasterViaDom} but without `crossOrigin` — some hosts omit CORS;
 * the bitmap may still decode for drawing (used after fetch/DOM+cors paths fail).
 */
function loadSvgOrRasterViaDomNoCors(
  p: p5Types,
  url: string,
): Promise<p5Types.Image | null> {
  return new Promise((resolve) => {
    const el = new Image();
    el.onload = () => {
      try {
        const w = Math.max(1, el.naturalWidth || el.width);
        const h = Math.max(1, el.naturalHeight || el.height);
        const g = p.createGraphics(w, h);
        g.pixelDensity(1);
        const ctx = g.drawingContext as CanvasRenderingContext2D;
        ctx.drawImage(el, 0, 0, w, h);
        const pimg = g.get(0, 0, w, h);
        g.remove();
        resolve(pimg.width > 0 ? pimg : null);
      } catch {
        resolve(null);
      }
    };
    el.onerror = () => resolve(null);
    el.src = url;
  });
}

/**
 * Remote PNG (e.g. user-painted Supabase URL) → p5.Image.
 * `p.loadImage(url)` alone often fails cross-origin or yields width 0; catalog art uses
 * `fetch`/DOM fallbacks — painted costumes need the same.
 */
async function loadRemoteBitmapForP5(
  p: p5Types,
  url: string,
): Promise<p5Types.Image | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (res.ok) {
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const img = await new Promise<p5Types.Image | null>((resolve) => {
        p.loadImage(
          objUrl,
          (loaded) => {
            URL.revokeObjectURL(objUrl);
            resolve(loaded && loaded.width > 0 ? loaded : null);
          },
          () => {
            URL.revokeObjectURL(objUrl);
            resolve(null);
          },
        );
      });
      if (img) return img;
    }
  } catch {
    /* fall through */
  }
  let viaDom = await loadSvgOrRasterViaDom(p, url);
  if (viaDom && viaDom.width > 0) return viaDom;
  viaDom = await loadSvgOrRasterViaDomNoCors(p, url);
  if (viaDom && viaDom.width > 0) return viaDom;
  return new Promise((resolve) => {
    p.loadImage(
      url,
      (loaded) => resolve(loaded && loaded.width > 0 ? loaded : null),
      () => resolve(null),
    );
  });
}

function normHeading(deg: number) {
  return ((deg % 360) + 360) % 360;
}

/** Scratch-style angle from (ax,ay) to (mx,my); 0° = up, 90° = right (y down on canvas). */
function scratchAngleDegTowardPoint(
  ax: number,
  ay: number,
  mx: number,
  my: number,
): number {
  return (Math.atan2(mx - ax, -(my - ay)) * 180) / Math.PI;
}

/**
 * Advance heading toward the Scratch direction `rawDeg` without collapsing to [0,360) each
 * step, so atan2’s π boundary doesn’t fight the stored angle frame-to-frame.
 */
function stepHeadingTowardScratchRaw(prevDeg: number, rawDeg: number): number {
  const tgt = normHeading(rawDeg);
  const prevN = normHeading(prevDeg);
  let d = tgt - prevN;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return prevDeg + d;
}

function resolveMouseOnStagePx(
  p: p5Types | null,
  ptr: { x: number; y: number } | null,
  cw: number,
  ch: number,
): { mx: number; my: number } | null {
  /**
   * Prefer p5’s mouse — it updates with the sketch and matches `sprite` pixel coords, which
   * reduces one-frame lag vs `pointermove` on `document` during async `forever` loops.
   */
  if (
    p &&
    Number.isFinite(p.mouseX) &&
    Number.isFinite(p.mouseY) &&
    p.mouseX >= 0 &&
    p.mouseX <= cw &&
    p.mouseY >= 0 &&
    p.mouseY <= ch
  ) {
    return { mx: p.mouseX, my: p.mouseY };
  }
  if (ptr) {
    return {
      mx: Math.max(0, Math.min(cw, ptr.x)),
      my: Math.max(0, Math.min(ch, ptr.y)),
    };
  }
  if (p && Number.isFinite(p.mouseX) && Number.isFinite(p.mouseY)) {
    return {
      mx: Math.max(0, Math.min(cw, p.mouseX)),
      my: Math.max(0, Math.min(ch, p.mouseY)),
    };
  }
  return null;
}

/** Debug session: cap aim-resolve logs (see agent instrumentation). */
let applyAimDbgLogCount = 0;
let actorsRunDbgLogCount = 0;

/** Squared distance below this → skip heading update (atan2 is unstable on the pivot). Keep tiny so tracking doesn’t trail. */
const AIM_MOUSE_DEAD_ZONE_SQ = 1;

function isTooCloseToAimPivot(
  ax: number,
  ay: number,
  mx: number,
  my: number,
): boolean {
  const dx = mx - ax;
  const dy = my - ay;
  return dx * dx + dy * dy < AIM_MOUSE_DEAD_ZONE_SQ;
}

/** Scratch 0° = up — aim from catalog/center/custom origin toward stage mouse px. */
function applyHeadingTowardsResolvedMouse(
  s: Sprite,
  mouse: { mx: number; my: number } | null,
): void {
  if (!mouse) return;
  const { mx, my } = mouse;
  const { fwd, lat } = resolvePointTowardFwdLat(s);
  // #region agent log
  if (applyAimDbgLogCount < 8) {
    applyAimDbgLogCount += 1;
    fetch(
      "http://127.0.0.1:7833/ingest/e924e2ad-468e-412a-bdf8-e4b573ccccd5",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "3a7dbb",
        },
        body: JSON.stringify({
          sessionId: "3a7dbb",
          runId: "pre-fix",
          hypothesisId: "H3",
          location: "P5Canvas.tsx:applyHeadingTowardsResolvedMouse",
          message: "resolved aim offsets",
          data: {
            aimOrigin: s.pointTowardsAimOrigin,
            lateralPct: s.pointTowardsLateralPct,
            lateralPx: s.pointTowardsLateralPx,
            fwd,
            lat,
            fwdLatZero: fwd === 0 && lat === 0,
          },
          timestamp: Date.now(),
        }),
      },
    ).catch(() => {});
  }
  // #endregion
  const aimPoint = (hDeg: number) => {
    const h = normHeading(hDeg);
    const rad = (h * Math.PI) / 180;
    const fx = Math.sin(rad);
    const fy = -Math.cos(rad);
    const lx = Math.cos(rad);
    const ly = Math.sin(rad);
    return {
      ax: s.x + fwd * fx + lat * lx,
      ay: s.y + fwd * fy + lat * ly,
    };
  };
  if (fwd === 0 && lat === 0) {
    if (isTooCloseToAimPivot(s.x, s.y, mx, my)) return;
    const raw = scratchAngleDegTowardPoint(s.x, s.y, mx, my);
    s.heading = stepHeadingTowardScratchRaw(s.heading, raw);
  } else {
    const seed = aimPoint(s.heading);
    if (isTooCloseToAimPivot(seed.ax, seed.ay, mx, my)) return;
    let h = stepHeadingTowardScratchRaw(
      s.heading,
      scratchAngleDegTowardPoint(s.x, s.y, mx, my),
    );
    for (let i = 0; i < 12; i += 1) {
      const { ax, ay } = aimPoint(h);
      if (isTooCloseToAimPivot(ax, ay, mx, my)) return;
      const raw = scratchAngleDegTowardPoint(ax, ay, mx, my);
      h = stepHeadingTowardScratchRaw(h, raw);
    }
    s.heading = h;
  }
}

/** Lazy-load user-painted costume URLs into the shared stage image map. */
function ensurePaintedCostumeImage(
  p: p5Types,
  url: string | undefined,
  images: Map<string, p5Types.Image>,
  pending: Set<string>,
) {
  const u = url?.trim();
  if (!u || images.has(u) || pending.has(u)) return;
  pending.add(u);
  void loadRemoteBitmapForP5(p, u)
    .then((img) => {
      if (img && img.width > 0) images.set(u, img);
    })
    .finally(() => {
      pending.delete(u);
    });
}

type SpriteDrawOrient = { rotationDeg: number; mirrorX: boolean };

/**
 * Scratch heading + optional costume bitmap offset (see `spriteRotationOffsetDeg`).
 * For side-view art, net 180° would rotate the whole costume upside down; use mirror
 * instead so “face left” stays upright.
 */
function spriteDrawOrient(
  s: Sprite,
  images: Map<string, p5Types.Image>,
): SpriteDrawOrient {
  const painted = s.paintedCostumeSrc?.trim();
  if (painted) {
    const img = images.get(painted);
    if (img && img.width > 0) {
      return { rotationDeg: normHeading(s.heading), mirrorX: false };
    }
    /** User bitmap: same as loaded path (no catalog sheet −90° offset). Don’t fall through. */
    return { rotationDeg: normHeading(s.heading), mirrorX: false };
  }
  const def =
    getCostumeById(s.costume) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  const off =
    typeof def.spriteRotationOffsetDeg === "number"
      ? def.spriteRotationOffsetDeg
      : 0;
  /**
   * Align Scratch heading with bitmap facing (see `spriteRotationOffsetDeg`) even before
   * `p5.Image` is ready — the old path used raw heading only and caused a visible snap.
   */
  const net = normHeading(s.heading + off);
  /**
   * Always rotate by `net`. The old `net === 180` + mirror branch caused a one-frame flip
   * (exact float equality + different transform) while tracking the pointer.
   */
  return { rotationDeg: net, mirrorX: false };
}

function layoutSlot(
  index: number,
  total: number,
  w: number,
  h: number,
): { x: number; y: number } {
  if (total <= 1) return { x: w / 2, y: h / 2 };
  const t = (index + 1) / (total + 1);
  return { x: w * t, y: h * 0.52 };
}

/** Scratch-style −100…100: x left→right, y up (+) → down (−); maps to canvas pixels (origin top-left). */
function scratchStageToPixel(
  xStage: number,
  yStage: number,
  cw: number,
  ch: number,
): { x: number; y: number } {
  const x = Math.min(100, Math.max(-100, xStage));
  const y = Math.min(100, Math.max(-100, yStage));
  return {
    x: ((x + 100) / 200) * cw,
    y: ((100 - y) / 200) * ch,
  };
}

/** Inverse of {@link scratchStageToPixel} — sprite center in px → Scratch coords. */
function pixelToScratchStage(
  px: number,
  py: number,
  cw: number,
  ch: number,
): { xPct: number; yPct: number } {
  const xPct = (px / Math.max(1, cw)) * 200 - 100;
  const yPct = 100 - (py / Math.max(1, ch)) * 200;
  return {
    xPct: Math.min(100, Math.max(-100, xPct)),
    yPct: Math.min(100, Math.max(-100, yPct)),
  };
}

function drawSceneLayer(
  p: p5Types,
  sceneId: OllieSceneId,
  images: Map<string, p5Types.Image>,
) {
  drawSceneLayers(p, [sceneId], images);
}

/** Draw each backdrop in order; upper layers paint on top (use PNG alpha to show through). */
function drawSceneLayers(
  p: p5Types,
  sceneIds: OllieSceneId[],
  images: Map<string, p5Types.Image>,
) {
  const layers = normalizeSceneLayerIdsFromPayload(sceneIds, undefined);
  let isFirst = true;
  for (const sceneId of layers) {
    const scene = getSceneById(sceneId) ?? getSceneById(DEFAULT_SCENE_ID)!;
    if (scene.kind === "solid") {
      const [r, g, b] = scene.rgb;
      if (isFirst) {
        p.background(r, g, b);
      } else {
        p.fill(r, g, b);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);
      }
    } else {
      const img = images.get(scene.src);
      if (img && img.width > 0) {
        if (isFirst) {
          p.background(0);
        }
        p.imageMode(p.CORNER);
        p.image(img, 0, 0, p.width, p.height);
      } else {
        const [r, g, b] = scene.fallbackRgb;
        if (isFirst) {
          p.background(r, g, b);
        } else {
          p.fill(r, g, b);
          p.noStroke();
          p.rect(0, 0, p.width, p.height);
        }
      }
    }
    isFirst = false;
  }
  p.imageMode(p.CENTER);
}

/** Matches Blockly event key dropdown values (`ollie_event_key_pressed`). */
function keyEventMatches(keyId: string, e: KeyboardEvent): boolean {
  switch (keyId) {
    case "space":
      return e.code === "Space" || e.key === " ";
    case "up":
      return e.code === "ArrowUp" || e.key === "ArrowUp";
    case "down":
      return e.code === "ArrowDown" || e.key === "ArrowDown";
    case "left":
      return e.code === "ArrowLeft" || e.key === "ArrowLeft";
    case "right":
      return e.code === "ArrowRight" || e.key === "ArrowRight";
    default:
      return (
        e.key.length === 1 && e.key.toLowerCase() === keyId.toLowerCase()
      );
  }
}

/** Normalized key id for Sensing — must match {@link keyEventMatches} / toolbox dropdowns. */
function keyIdFromKeyboardEvent(e: KeyboardEvent): string | null {
  if (e.code === "Space" || e.key === " ") return "space";
  if (e.code === "ArrowUp" || e.key === "ArrowUp") return "up";
  if (e.code === "ArrowDown" || e.key === "ArrowDown") return "down";
  if (e.code === "ArrowLeft" || e.key === "ArrowLeft") return "left";
  if (e.code === "ArrowRight" || e.key === "ArrowRight") return "right";
  if (e.key.length === 1) return e.key.toLowerCase();
  return null;
}

/** Trim transparent margins once per URL so paint exports aren’t dominated by empty canvas. */
const paintedContentBoundsCache = new Map<
  string,
  { sx: number; sy: number; sw: number; sh: number }
>();

function paintedContentBoundsForKey(
  urlKey: string,
  img: p5Types.Image,
): { sx: number; sy: number; sw: number; sh: number } {
  const hit = paintedContentBoundsCache.get(urlKey);
  if (hit) return hit;
  img.loadPixels();
  const px = img.pixels;
  const iw = img.width;
  const ih = img.height;
  let b: { sx: number; sy: number; sw: number; sh: number };
  if (px && px.length >= iw * ih * 4) {
    b = nonTransparentPixelBounds(px, iw, ih);
  } else {
    b = { sx: 0, sy: 0, sw: iw, sh: ih };
  }
  if (b.sw <= 0 || b.sh <= 0 || b.sw > iw || b.sh > ih) {
    b = { sx: 0, sy: 0, sw: iw, sh: ih };
  }
  paintedContentBoundsCache.set(urlKey, b);
  return b;
}

function drawSpriteForCostume(
  p: p5Types,
  sprite: Sprite,
  images: Map<string, p5Types.Image>,
) {
  const sizePct = sprite.sizePct ?? 100;
  const sc = Math.max(
    MIN_SPRITE_SIZE_PCT / 100,
    Math.min(MAX_SPRITE_SIZE_PCT / 100, sizePct / 100),
  );
  p.scale(sc);
  const painted = sprite.paintedCostumeSrc?.trim();
  if (painted) {
    const img = images.get(painted);
    if (img && img.width > 0) {
      const b = paintedContentBoundsForKey(painted, img);
      const { w, h } = paintedCostumeFitInBox(
        b.sw,
        b.sh,
        PAINTED_COSTUME_FIT_BOX_PX,
      );
      p.image(img, 0, 0, w, h, b.sx, b.sy, b.sw, b.sh);
      return;
    }
    p.stroke(255);
    p.strokeWeight(2);
    p.fill(132, 193, 38);
    p.triangle(0, -34, -26, 26, 26, 26);
    return;
  }
  const def =
    getCostumeById(sprite.costume) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  const img = images.get(def.src);
  if (img && img.width > 0) {
    const cols = def.spriteSheet?.columns ?? 1;
    const rows = def.spriteSheet?.rows ?? 1;
    const cellW = Math.floor(img.width / cols);
    const cellH = Math.floor(img.height / rows);
    const n = Math.max(1, cols * rows);
    const fi = ((sprite.sheetFrame % n) + n) % n;
    const col = fi % cols;
    const row = Math.floor(fi / cols);
    const sx = col * cellW;
    const sy = row * cellH;
    const w = def.width;
    const h = w * (cellH / cellW);
    p.image(img, 0, 0, w, h, sx, sy, cellW, cellH);
  } else {
    p.stroke(255);
    p.strokeWeight(2);
    p.fill(132, 193, 38);
    p.triangle(0, -34, -26, 26, 26, 26);
  }
}

export const P5Canvas = forwardRef<P5CanvasHandle, P5CanvasProps>(
  function P5Canvas(
    {
      className,
      sceneLayerIds,
      actors,
      pauseActorCostumePropSync = false,
      onSceneChange,
      onActorCostumeChange,
      onActorPointTowardAimChange,
      requestNumberInput,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const p5Ref = useRef<p5Types | null>(null);
    const spritesByIdRef = useRef<Map<string, Sprite>>(new Map());
    const normalizedLayers = normalizeSceneLayerIdsFromPayload(
      sceneLayerIds,
      undefined,
    );
    const topSceneId =
      normalizedLayers[normalizedLayers.length - 1] ?? DEFAULT_SCENE_ID;
    const currentSceneRef = useRef<OllieSceneId>(topSceneId);
    const runningRef = useRef(false);
    const abortRunRef = useRef(false);
    const keysHeldRef = useRef<Set<string>>(new Set());
    const timerStartMsRef = useRef(0);
    const onSceneChangeRef = useRef(onSceneChange);
    const onActorCostumeChangeRef = useRef(onActorCostumeChange);
    const onActorPointTowardAimChangeRef = useRef(
      onActorPointTowardAimChange,
    );
    const actorsRef = useRef(actors);
    onSceneChangeRef.current = onSceneChange;
    onActorCostumeChangeRef.current = onActorCostumeChange;
    onActorPointTowardAimChangeRef.current = onActorPointTowardAimChange;
    actorsRef.current = actors;

    const requestNumberInputRef = useRef<
      typeof requestNumberInput | undefined
    >(requestNumberInput);
    requestNumberInputRef.current = requestNumberInput;

    const latestSceneLayerIdsRef = useRef<OllieSceneId[]>(normalizedLayers);
    latestSceneLayerIdsRef.current = normalizedLayers;

    const latestSceneIdRef = useRef<OllieSceneId>(topSceneId);
    latestSceneIdRef.current = topSceneId;

    /** After Run, scene-change scripts use this; cleared on the next Run. */
    const sessionActiveRef = useRef(false);
    const backdropPackRef = useRef<{
      plans: { spriteId: string; plan: SpriteScriptPlan }[];
      runSequence: (spriteId: string, actions: OllieAction[]) => Promise<void>;
    } | null>(null);
    const stageClickHandlerRef = useRef<(() => void) | null>(null);
    const keyDownHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(
      null,
    );
    /**
     * One-time heading fix per actor: older runtime used 0° at rest; Scratch
     * default is 90° (face right). Without this, existing map entries never pick up
     * {@link DEFAULT_SPRITE_HEADING_DEG}.
     */
    const headingLegacyMigratedRef = useRef<Set<string>>(new Set());

    /**
     * Last pointer position in **p5 logical canvas space** (same as `sprite.x` / `mouseX`).
     * Must not use the outer div’s rect alone: on HiDPI or when the canvas CSS size ≠ buffer
     * size, container coords and sprite coords diverge and “point toward” looks ~90° wrong.
     */
    const lastPointerOnStageRef = useRef<{ x: number; y: number } | null>(
      null,
    );

    useEffect(() => {
      const onMove = (e: PointerEvent) => {
        const pInst = p5Ref.current;
        const cv = pInst?.drawingContext?.canvas as
          | HTMLCanvasElement
          | undefined;
        if (!pInst || !cv || pInst.width <= 0 || pInst.height <= 0) return;
        const r = cv.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        const rawX = e.clientX - r.left;
        const rawY = e.clientY - r.top;
        if (rawX < 0 || rawY < 0 || rawX > r.width || rawY > r.height) {
          lastPointerOnStageRef.current = null;
          return;
        }
        const sx = pInst.width / r.width;
        const sy = pInst.height / r.height;
        lastPointerOnStageRef.current = {
          x: rawX * sx,
          y: rawY * sy,
        };
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      return () => document.removeEventListener("pointermove", onMove);
    }, []);

    useEffect(() => {
      currentSceneRef.current = topSceneId;
    }, [topSceneId]);

    /** Scratch-style “when scene switches to …” — fires when the top backdrop changes after a Run. */
    useEffect(() => {
      const pack = backdropPackRef.current;
      if (!sessionActiveRef.current || !pack) return;
      for (const { spriteId, plan } of pack.plans) {
        for (const bd of plan.backdropScripts) {
          if (bd.sceneId === topSceneId) {
            void pack.runSequence(spriteId, bd.actions);
          }
        }
      }
    }, [topSceneId]);

    useEffect(() => {
      const el = containerRef.current;
      const w = Math.min(
        CANVAS_MAX_PX,
        Math.max(1, el?.clientWidth ?? 400),
      );
      const h = Math.min(
        CANVAS_MAX_PX,
        Math.max(1, el?.clientHeight ?? 300),
      );
      const map = spritesByIdRef.current;
      const ids = new Set(actors.map((a) => a.id));
      for (const id of [...map.keys()]) {
        if (!ids.has(id)) {
          map.delete(id);
          headingLegacyMigratedRef.current.delete(id);
        }
      }
      actors.forEach((a, i) => {
        const nextPainted = a.paintedCostumeUrl?.trim() || undefined;
        const existing = map.get(a.id);
        if (existing) {
          existing.sizePct = existing.sizePct ?? 100;
          existing.visible = existing.visible !== false;
          existing.paintedCostumeSrc = nextPainted;
          // #region agent log
          if (runningRef.current && actorsRunDbgLogCount < 12) {
            actorsRunDbgLogCount += 1;
            fetch(
              "http://127.0.0.1:7833/ingest/e924e2ad-468e-412a-bdf8-e4b573ccccd5",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Debug-Session-Id": "3a7dbb",
                },
                body: JSON.stringify({
                  sessionId: "3a7dbb",
                  runId: "pre-fix",
                  hypothesisId: "H4",
                  location: "P5Canvas.tsx:actors-sync",
                  message: "actors effect while run (no aim stomp)",
                  data: {
                    actorId: a.id,
                    propPct: a.pointTowardsLateralPct,
                    spritePct: existing.pointTowardsLateralPct,
                  },
                  timestamp: Date.now(),
                }),
              },
            ).catch(() => {});
          }
          // #endregion
          /**
           * `runningRef` is set true synchronously at the start of `runProjectPlans`, before any
           * `await`. `programRunning` / `pauseActorCostumePropSync` only updates after React commits,
           * so relying on it alone let this effect overwrite script-driven aim from stale props.
           */
          if (!runningRef.current) {
            existing.pointTowardsAimOrigin = a.pointTowardsAimOrigin;
            existing.pointTowardsForwardPx = a.pointTowardsForwardPx;
            existing.pointTowardsLateralPx = a.pointTowardsLateralPx;
            existing.pointTowardsLateralPct = a.pointTowardsLateralPct;
            if (existing.costume !== a.costumeId) {
              existing.sheetFrame = defaultSheetFrameForCostumeId(a.costumeId);
            }
            existing.costume = a.costumeId;
          }
          if (
            existing.heading === 0 &&
            !headingLegacyMigratedRef.current.has(a.id)
          ) {
            existing.heading = DEFAULT_SPRITE_HEADING_DEG;
            headingLegacyMigratedRef.current.add(a.id);
          }
        } else {
          const pos = layoutSlot(i, actors.length, w, h);
          map.set(a.id, {
            x: pos.x,
            y: pos.y,
            heading: DEFAULT_SPRITE_HEADING_DEG,
            costume: a.costumeId,
            paintedCostumeSrc: nextPainted,
            sheetFrame: defaultSheetFrameForCostumeId(a.costumeId),
            sizePct: 100,
            visible: true,
            pointTowardsAimOrigin: a.pointTowardsAimOrigin,
            pointTowardsForwardPx: a.pointTowardsForwardPx,
            pointTowardsLateralPx: a.pointTowardsLateralPx,
            pointTowardsLateralPct: a.pointTowardsLateralPct,
          });
        }
      });
    }, [actors, pauseActorCostumePropSync]);

    useImperativeHandle(ref, () => {
      const resetSpriteImpl = () => {
        const el = containerRef.current;
        const w = Math.min(
          CANVAS_MAX_PX,
          Math.max(1, el?.clientWidth ?? 320),
        );
        const h = Math.min(
          CANVAS_MAX_PX,
          Math.max(1, el?.clientHeight ?? 240),
        );
        const list = actorsRef.current;
        const map = spritesByIdRef.current;
        list.forEach((a, i) => {
          const s = map.get(a.id);
          if (!s) return;
          const pos = layoutSlot(i, list.length, w, h);
          s.x = pos.x;
          s.y = pos.y;
          s.heading = DEFAULT_SPRITE_HEADING_DEG;
          s.bubble = undefined;
          s.costume = a.costumeId;
          s.paintedCostumeSrc = a.paintedCostumeUrl?.trim() || undefined;
          s.sheetFrame = defaultSheetFrameForCostumeId(a.costumeId);
          s.sizePct = 100;
          s.visible = true;
          s.pointTowardsAimOrigin = a.pointTowardsAimOrigin;
          s.pointTowardsForwardPx = a.pointTowardsForwardPx;
          s.pointTowardsLateralPx = a.pointTowardsLateralPx;
          s.pointTowardsLateralPct = a.pointTowardsLateralPct;
        });
      };

      return {
      async runProjectPlans(
        plans: { spriteId: string; plan: SpriteScriptPlan }[],
      ) {
        if (runningRef.current) return { aborted: false };
        if (keyDownHandlerRef.current) {
          window.removeEventListener(
            "keydown",
            keyDownHandlerRef.current,
            KEY_LISTENER_CAPTURE,
          );
          keyDownHandlerRef.current = null;
        }
        sessionActiveRef.current = false;
        backdropPackRef.current = null;
        stageClickHandlerRef.current = null;

        runningRef.current = true;
        abortRunRef.current = false;
        const runVars: Record<string, number> = Object.create(null);
        let broadcastDepth = 0;
        let stopAllScripts = false;

        const shouldCancel = () => {
          if (abortRunRef.current) stopAllScripts = true;
          return stopAllScripts;
        };

        keysHeldRef.current.clear();
        timerStartMsRef.current = performance.now();
        const onSensingKeyDown = (e: KeyboardEvent) => {
          const id = keyIdFromKeyboardEvent(e);
          if (id) keysHeldRef.current.add(id);
        };
        const onSensingKeyUp = (e: KeyboardEvent) => {
          const id = keyIdFromKeyboardEvent(e);
          if (id) keysHeldRef.current.delete(id);
        };
        window.addEventListener(
          "keydown",
          onSensingKeyDown,
          KEY_LISTENER_CAPTURE,
        );
        window.addEventListener("keyup", onSensingKeyUp, KEY_LISTENER_CAPTURE);

        /**
         * Always returns a context with `vars` so `setVar` / `if` never silently skip while
         * `prompt` still mutates `runVars` (would leave e.g. `Answer` unset vs `Guess` set).
         */
        function buildSensingCtx(sid: string): SensingEvalContext {
          const sprite = spritesByIdRef.current.get(sid);
          const box = containerRef.current?.getBoundingClientRect();
          const p = p5Ref.current;
          const cw =
            p && p.width > 0
              ? p.width
              : Math.min(CANVAS_MAX_PX, Math.max(1, box?.width ?? 400));
          const ch =
            p && p.height > 0
              ? p.height
              : Math.min(CANVAS_MAX_PX, Math.max(1, box?.height ?? 300));
          const ptr = lastPointerOnStageRef.current;
          let mouseX = p?.mouseX ?? 0;
          let mouseY = p?.mouseY ?? 0;
          if (ptr) {
            mouseX = Math.max(0, Math.min(cw, ptr.x));
            mouseY = Math.max(0, Math.min(ch, ptr.y));
          } else if (
            p &&
            p.mouseX >= 0 &&
            p.mouseX <= cw &&
            p.mouseY >= 0 &&
            p.mouseY <= ch
          ) {
            mouseX = p.mouseX;
            mouseY = p.mouseY;
          }
          return {
            cw,
            ch,
            spriteId: sid,
            spriteX: sprite?.x ?? 0,
            spriteY: sprite?.y ?? 0,
            mouseX,
            mouseY,
            mouseIsPressed: p?.mouseIsPressed ?? false,
            keysDown: keysHeldRef.current,
            timerSecs: (performance.now() - timerStartMsRef.current) / 1000,
            vars: runVars,
          };
        }

        async function dispatchBroadcast(
          message: string,
          wait: boolean,
        ): Promise<void> {
          if (broadcastDepth > 24) return;
          broadcastDepth += 1;
          try {
            const runners: Promise<void>[] = [];
            for (const { spriteId: sid, plan } of plans) {
              for (const bc of plan.broadcastScripts) {
                if (bc.message === message) {
                  runners.push(runSequenceForSprite(sid, bc.actions));
                }
              }
            }
            if (wait) await Promise.all(runners);
            else void Promise.all(runners);
          } finally {
            broadcastDepth -= 1;
          }
        }

        async function runSequenceForSprite(
          spriteId: string,
          actions: OllieAction[],
        ): Promise<void> {
          const s = spritesByIdRef.current.get(spriteId);
          if (!s) return;
          const box = containerRef.current?.getBoundingClientRect();
          const pStage = p5Ref.current;
          const cw =
            pStage && pStage.width > 0
              ? pStage.width
              : Math.min(CANVAS_MAX_PX, Math.max(1, box?.width ?? 400));
          const ch =
            pStage && pStage.height > 0
              ? pStage.height
              : Math.min(CANVAS_MAX_PX, Math.max(1, box?.height ?? 300));

          for (const a of actions) {
            if (shouldCancel()) return;
            if (a.type === "rotate") {
              s.heading = normHeading(s.heading + a.degrees);
            } else if (a.type === "setHeading") {
              s.heading = normHeading(a.degrees);
            } else if (a.type === "pointTowardsMouse") {
              const mouse = resolveMouseOnStagePx(
                p5Ref.current,
                lastPointerOnStageRef.current,
                cw,
                ch,
              );
              if (!mouse) {
                /** Run tapped off-stage — avoid using p5’s (0,0) as the target. */
                continue;
              }
              applyHeadingTowardsResolvedMouse(s, mouse);
            } else if (a.type === "move") {
              const rad = (s.heading * Math.PI) / 180;
              const dx = Math.sin(rad) * a.distance;
              const dy = -Math.cos(rad) * a.distance;
              await animateMove(
                s,
                s.x + dx,
                s.y + dy,
                MOVE_FRAMES,
                shouldCancel,
              );
            } else if (a.type === "moveWithBob") {
              const rad = (s.heading * Math.PI) / 180;
              const dx = Math.sin(rad) * a.distance;
              const dy = -Math.cos(rad) * a.distance;
              const isRun = a.style === "run";
              const bob = isRun
                ? { amplitude: 7, cycles: 3 }
                : { amplitude: 5.5, cycles: 2 };
              const frames = isRun
                ? Math.max(10, Math.round(MOVE_FRAMES * 0.62))
                : MOVE_FRAMES;
              await animateMove(
                s,
                s.x + dx,
                s.y + dy,
                frames,
                shouldCancel,
                bob,
              );
            } else if (a.type === "goTo") {
              const pos = scratchStageToPixel(a.xPct, a.yPct, cw, ch);
              s.x = pos.x;
              s.y = pos.y;
            } else if (a.type === "goToTarget") {
              if (a.target === "mouse") {
                const ptr = lastPointerOnStageRef.current;
                if (ptr) {
                  s.x = Math.max(0, Math.min(cw, ptr.x));
                  s.y = Math.max(0, Math.min(ch, ptr.y));
                }
              } else {
                const xPct = Math.random() * 200 - 100;
                const yPct = Math.random() * 200 - 100;
                const pos = scratchStageToPixel(xPct, yPct, cw, ch);
                s.x = pos.x;
                s.y = pos.y;
              }
            } else if (a.type === "changeXPctBy") {
              const { xPct, yPct } = pixelToScratchStage(
                s.x,
                s.y,
                cw,
                ch,
              );
              const nx = Math.min(100, Math.max(-100, xPct + a.deltaPct));
              const pos = scratchStageToPixel(nx, yPct, cw, ch);
              s.x = pos.x;
              s.y = pos.y;
            } else if (a.type === "changeYPctBy") {
              const { xPct, yPct } = pixelToScratchStage(
                s.x,
                s.y,
                cw,
                ch,
              );
              const ny = Math.min(100, Math.max(-100, yPct + a.deltaPct));
              const pos = scratchStageToPixel(xPct, ny, cw, ch);
              s.x = pos.x;
              s.y = pos.y;
            } else if (a.type === "glideTo") {
              const { x: tx, y: ty } = scratchStageToPixel(
                a.xPct,
                a.yPct,
                cw,
                ch,
              );
              await animateMove(
                s,
                tx,
                ty,
                Math.max(8, Math.round((a.secs * 1000) / 16)),
                shouldCancel,
              );
            } else if (a.type === "jumpArc") {
              const { xPct, yPct } = pixelToScratchStage(
                s.x,
                s.y,
                cw,
                ch,
              );
              const peakY = Math.min(
                100,
                Math.max(-100, yPct + a.peakYPct),
              );
              const frames = Math.max(
                8,
                Math.round((a.halfSecs * 1000) / 16),
              );
              const up = scratchStageToPixel(xPct, peakY, cw, ch);
              await animateMove(s, up.x, up.y, frames, shouldCancel);
              const down = scratchStageToPixel(xPct, yPct, cw, ch);
              await animateMove(s, down.x, down.y, frames, shouldCancel);
            } else if (a.type === "bounceEdge") {
              const m = 14;
              if (
                s.x <= m ||
                s.x >= cw - m ||
                s.y <= m ||
                s.y >= ch - m
              ) {
                s.heading = normHeading(s.heading + 180);
              }
            } else if (a.type === "say") {
              s.bubble = {
                text: a.text,
                kind: "say",
                until: Date.now() + a.ms,
              };
              await waitMs(a.ms, shouldCancel);
              s.bubble = undefined;
            } else if (a.type === "sayDynamic") {
              const ctx = buildSensingCtx(spriteId);
              const text = evalSerializedString(a.expr, ctx).slice(0, 120);
              s.bubble = {
                text,
                kind: "say",
                until: Date.now() + a.ms,
              };
              await waitMs(a.ms, shouldCancel);
              s.bubble = undefined;
            } else if (a.type === "think") {
              s.bubble = {
                text: a.text,
                kind: "think",
                until: Date.now() + a.ms,
              };
              await waitMs(a.ms, shouldCancel);
              s.bubble = undefined;
            } else if (a.type === "changeSize") {
              const cur = s.sizePct ?? 100;
              s.sizePct = Math.min(
                MAX_SPRITE_SIZE_PCT,
                Math.max(MIN_SPRITE_SIZE_PCT, cur + a.deltaPct),
              );
            } else if (a.type === "setSizePct") {
              s.sizePct = Math.min(
                MAX_SPRITE_SIZE_PCT,
                Math.max(MIN_SPRITE_SIZE_PCT, a.sizePct),
              );
            } else if (a.type === "setVisible") {
              s.visible = a.visible;
            } else if (a.type === "setPointTowardAim") {
              s.pointTowardsAimOrigin = a.origin;
              // #region agent log
              fetch(
                "http://127.0.0.1:7833/ingest/e924e2ad-468e-412a-bdf8-e4b573ccccd5",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Debug-Session-Id": "3a7dbb",
                  },
                  body: JSON.stringify({
                    sessionId: "3a7dbb",
                    runId: "pre-fix",
                    hypothesisId: "H2",
                    location: "P5Canvas.tsx:setPointTowardAim",
                    message: "runtime setPointTowardAim action",
                    data: {
                      origin: a.origin,
                      lateralPct: a.lateralPct,
                      lateralPctType: typeof a.lateralPct,
                      forwardPx: a.forwardPx,
                      lateralPx: a.lateralPx,
                    },
                    timestamp: Date.now(),
                  }),
                },
              ).catch(() => {});
              // #endregion
              if (a.origin === "custom") {
                if (typeof a.lateralPct === "number") {
                  s.pointTowardsLateralPct = a.lateralPct;
                  s.pointTowardsForwardPx = 0;
                  s.pointTowardsLateralPx = undefined;
                } else {
                  s.pointTowardsForwardPx = a.forwardPx ?? 0;
                  s.pointTowardsLateralPx = a.lateralPx ?? 0;
                  s.pointTowardsLateralPct = undefined;
                }
              } else {
                s.pointTowardsForwardPx = undefined;
                s.pointTowardsLateralPx = undefined;
                s.pointTowardsLateralPct = undefined;
              }
              onActorPointTowardAimChangeRef.current?.(spriteId, {
                pointTowardsAimOrigin: a.origin,
                ...(a.origin === "custom"
                  ? typeof a.lateralPct === "number"
                    ? {
                        pointTowardsForwardPx: 0,
                        pointTowardsLateralPx: undefined,
                        pointTowardsLateralPct: a.lateralPct,
                      }
                    : {
                        pointTowardsForwardPx: a.forwardPx ?? 0,
                        pointTowardsLateralPx: a.lateralPx ?? 0,
                        pointTowardsLateralPct: undefined,
                      }
                  : {
                      pointTowardsForwardPx: undefined,
                      pointTowardsLateralPx: undefined,
                      pointTowardsLateralPct: undefined,
                    }),
              });
              const mouse = resolveMouseOnStagePx(
                p5Ref.current,
                lastPointerOnStageRef.current,
                cw,
                ch,
              );
              applyHeadingTowardsResolvedMouse(s, mouse);
            } else if (a.type === "setPaintedCostumeUrl") {
              const url = a.url.trim();
              if (url) {
                s.costume = DEFAULT_COSTUME_ID;
                s.sheetFrame = 0;
                s.paintedCostumeSrc = url;
                onActorCostumeChangeRef.current(
                  spriteId,
                  DEFAULT_COSTUME_ID,
                  url,
                );
              }
            } else if (a.type === "costume") {
              const id = migrateCostumeIdFromStorage(a.id);
              s.costume = id;
              s.sheetFrame = defaultSheetFrameForCostumeId(id);
              s.paintedCostumeSrc = undefined;
              onActorCostumeChangeRef.current(spriteId, id);
            } else if (a.type === "nextCostume") {
              const curDef =
                getCostumeById(s.costume) ??
                getCostumeById(DEFAULT_COSTUME_ID)!;
              if (curDef.kind === "image" && curDef.spriteSheet) {
                const n = Math.max(
                  1,
                  curDef.spriteSheet.columns * curDef.spriteSheet.rows,
                );
                s.sheetFrame = (s.sheetFrame + 1) % n;
              } else {
                const nextId = nextOllieSpriteCostumeId(s.costume);
                if (nextId !== s.costume) {
                  s.costume = nextId;
                  s.sheetFrame = defaultSheetFrameForCostumeId(nextId);
                  s.paintedCostumeSrc = undefined;
                  onActorCostumeChangeRef.current(spriteId, nextId);
                }
              }
            } else if (a.type === "scene") {
              currentSceneRef.current = a.id;
              latestSceneLayerIdsRef.current = [a.id];
              onSceneChangeRef.current(a.id);
            } else if (a.type === "nextScene") {
              const layers = latestSceneLayerIdsRef.current;
              const top =
                layers[layers.length - 1] ?? currentSceneRef.current;
              const next = nextOllieSceneId(top);
              currentSceneRef.current = next;
              latestSceneLayerIdsRef.current = [next];
              onSceneChangeRef.current(next);
            } else if (a.type === "sound") {
              playOllieSound(a.id);
            } else if (a.type === "soundWait") {
              playOllieSound(a.id);
              await waitMs(a.ms, shouldCancel);
            } else if (a.type === "wait") {
              await waitMs(a.ms, shouldCancel);
            } else if (a.type === "setVar") {
              const ctx = buildSensingCtx(spriteId);
              assignRunVar(
                runVars,
                a.varId,
                evalSerializedNum(a.value, ctx),
                a.varName,
              );
            } else if (a.type === "changeVar") {
              const ctx = buildSensingCtx(spriteId);
              const cur =
                readVarValue(runVars, a.varId, a.varName) ?? 0;
              assignRunVar(
                runVars,
                a.varId,
                cur + evalSerializedNum(a.delta, ctx),
                a.varName,
              );
            } else if (a.type === "promptAndSetVar") {
              const ctx = buildSensingCtx(spriteId);
              let promptMsg = a.message;
              if (a.messageExpr != null) {
                const ev = evalSerializedString(a.messageExpr, ctx);
                if (ev.length > 0) promptMsg = ev;
              }
              const req = requestNumberInputRef.current;
              let parsed: number;
              if (req) {
                parsed = await req(promptMsg, a.numberOnly);
                if (shouldCancel()) return;
              } else {
                const raw =
                  typeof window !== "undefined"
                    ? window.prompt(promptMsg, "")
                    : null;
                if (shouldCancel()) return;
                parsed = Number.parseFloat(String(raw ?? "").trim());
              }
              if (Number.isFinite(parsed)) {
                assignRunVar(
                  runVars,
                  a.varId,
                  parsed,
                  a.varName,
                );
              }
            } else if (a.type === "repeatDynamic") {
              const ctx = buildSensingCtx(spriteId);
              const n = Math.min(
                MAX_REPEAT_DYNAMIC_ITER,
                Math.max(0, Math.floor(evalSerializedNum(a.times, ctx))),
              );
              for (let r = 0; r < n; r++) {
                if (shouldCancel()) return;
                await runSequenceForSprite(spriteId, a.body);
              }
            } else if (a.type === "ifChainDynamic") {
              const ctx = buildSensingCtx(spriteId);
              let taken = false;
              for (const br of a.branches) {
                if (evalSerializedBool(br.cond, ctx)) {
                  await runSequenceForSprite(spriteId, br.body);
                  taken = true;
                  break;
                }
              }
              if (!taken && a.elseBody?.length) {
                await runSequenceForSprite(spriteId, a.elseBody);
              }
            } else if (a.type === "whileUntilDynamic") {
              let w = 0;
              while (w < MAX_DYNAMIC_WHILE_ITER) {
                if (shouldCancel()) return;
                const ctx = buildSensingCtx(spriteId);
                const ok = evalSerializedBool(a.cond, ctx);
                const go = a.mode === "WHILE" ? ok : !ok;
                if (!go) break;
                await runSequenceForSprite(spriteId, a.body);
                w += 1;
              }
            } else if (a.type === "foreverLoop") {
              while (!shouldCancel()) {
                await runSequenceForSprite(spriteId, a.body);
                if (shouldCancel()) return;
                await waitNextAnimationFrame(shouldCancel);
              }
            } else if (a.type === "resetTimer") {
              timerStartMsRef.current = performance.now();
            } else if (a.type === "broadcast") {
              void dispatchBroadcast(a.message, false);
            } else if (a.type === "broadcastWait") {
              await dispatchBroadcast(a.message, true);
            } else if (a.type === "stop") {
              if (a.scope === "all") {
                stopAllScripts = true;
                stopOllieSounds();
                return;
              }
              return;
            } else if (a.type === "deleteThisClone") {
              if (s.isClone) {
                spritesByIdRef.current.delete(spriteId);
                return;
              }
            }
          }
        }

        sessionActiveRef.current = true;
        backdropPackRef.current = { plans, runSequence: runSequenceForSprite };

        const keyHandler = (e: KeyboardEvent) => {
          let handled = false;
          for (const { spriteId: sid, plan } of plans) {
            for (const ks of plan.keyScripts) {
              if (keyEventMatches(ks.keyId, e)) {
                e.preventDefault();
                handled = true;
                void runSequenceForSprite(sid, ks.actions);
              }
            }
          }
          if (handled) e.stopPropagation();
        };
        keyDownHandlerRef.current = keyHandler;
        window.addEventListener(
          "keydown",
          keyHandler,
          KEY_LISTENER_CAPTURE,
        );

        stageClickHandlerRef.current = () => {
          for (const { spriteId: sid, plan } of plans) {
            for (const chain of plan.stageClickScripts) {
              void runSequenceForSprite(sid, chain);
            }
          }
        };

        let aborted = false;
        try {
          const greenRunners: Promise<void>[] = [];
          for (const { spriteId: sid, plan } of plans) {
            for (const chain of plan.runScripts) {
              greenRunners.push(runSequenceForSprite(sid, chain));
            }
          }
          await Promise.all(greenRunners);
        } finally {
          window.removeEventListener(
            "keydown",
            onSensingKeyDown,
            KEY_LISTENER_CAPTURE,
          );
          window.removeEventListener(
            "keyup",
            onSensingKeyUp,
            KEY_LISTENER_CAPTURE,
          );
          aborted = abortRunRef.current;
          abortRunRef.current = false;
          runningRef.current = false;
        }
        return { aborted };
      },
      stopRun() {
        abortRunRef.current = true;
        stopOllieSounds();
      },
      resetSprite: resetSpriteImpl,
      resetRunToBeginning() {
        abortRunRef.current = true;
        stopOllieSounds();
        if (keyDownHandlerRef.current) {
          window.removeEventListener(
            "keydown",
            keyDownHandlerRef.current,
            KEY_LISTENER_CAPTURE,
          );
          keyDownHandlerRef.current = null;
        }
        sessionActiveRef.current = false;
        backdropPackRef.current = null;
        stageClickHandlerRef.current = null;
        resetSpriteImpl();
      },
    };
    });

    useEffect(() => {
      let disposed = false;
      let p5instance: p5Types | null = null;
      let resizeObserver: ResizeObserver | null = null;
      const stageImages = new Map<string, p5Types.Image>();

      void import("p5").then((P5) => {
        if (disposed || !containerRef.current) return;
        const p5 = P5.default;

        const paintedLoadPending = new Set<string>();

        const sketch = (p: p5Types) => {
          p.setup = async () => {
            const el = containerRef.current!;
            const cw = Math.min(CANVAS_MAX_PX, Math.max(1, el.clientWidth));
            const ch = Math.min(CANVAS_MAX_PX, Math.max(1, el.clientHeight));
            p.createCanvas(cw, ch);
            /** Keep logical coords === backing-store coords so pointer ↔ sprite math stays aligned. */
            p.pixelDensity(1);
            p.angleMode(p.DEGREES);
            const urls = collectStageImageUrls();
            await Promise.all(
              urls.map((url) => loadStageImage(p, url, stageImages)),
            );
            currentSceneRef.current = latestSceneIdRef.current;
            const map = spritesByIdRef.current;
            map.clear();
            const list = actorsRef.current;
            list.forEach((a, i) => {
              const pos = layoutSlot(i, list.length, cw, ch);
              map.set(a.id, {
                x: pos.x,
                y: pos.y,
                heading: DEFAULT_SPRITE_HEADING_DEG,
                costume: a.costumeId,
                paintedCostumeSrc: a.paintedCostumeUrl?.trim() || undefined,
                sheetFrame: defaultSheetFrameForCostumeId(a.costumeId),
                sizePct: 100,
                visible: true,
                pointTowardsAimOrigin: a.pointTowardsAimOrigin,
                pointTowardsForwardPx: a.pointTowardsForwardPx,
                pointTowardsLateralPx: a.pointTowardsLateralPx,
                pointTowardsLateralPct: a.pointTowardsLateralPct,
              });
            });
          };

          p.draw = () => {
            const layers = latestSceneLayerIdsRef.current;
            const sid =
              layers[layers.length - 1] ?? DEFAULT_SCENE_ID;
            const sceneMeta = getSceneById(sid) ?? getSceneById(DEFAULT_SCENE_ID)!;
            drawSceneLayers(p, layers, stageImages);
            if (sceneMeta.grid) {
              drawDotsBackground(p);
            }
            const order = actorsRef.current.map((a) => a.id);
            for (const id of order) {
              const s = spritesByIdRef.current.get(id);
              if (!s || s.visible === false) continue;
              ensurePaintedCostumeImage(
                p,
                s.paintedCostumeSrc,
                stageImages,
                paintedLoadPending,
              );
              p.push();
              p.translate(s.x, s.y);
              const o = spriteDrawOrient(s, stageImages);
              if (o.mirrorX) p.scale(-1, 1);
              p.rotate(o.rotationDeg);
              p.imageMode(p.CENTER);
              drawSpriteForCostume(p, s, stageImages);
              p.pop();
            }
            for (const id of order) {
              const s = spritesByIdRef.current.get(id);
              if (
                s?.visible !== false &&
                s?.bubble &&
                Date.now() < s.bubble.until
              ) {
                drawBubble(p, s.x, s.y, s.bubble.text, s.bubble.kind);
              }
            }
          };

          p.windowResized = () => {
            if (!containerRef.current) return;
            const el = containerRef.current;
            p.resizeCanvas(
              Math.min(CANVAS_MAX_PX, Math.max(1, el.clientWidth)),
              Math.min(CANVAS_MAX_PX, Math.max(1, el.clientHeight)),
            );
            p.pixelDensity(1);
          };

          p.mousePressed = () => {
            stageClickHandlerRef.current?.();
          };
        };

        p5instance = new p5(sketch, containerRef.current);
        p5Ref.current = p5instance;

        const el = containerRef.current;
        let resizeRaf = 0;
        resizeObserver = new ResizeObserver(() => {
          if (!el || !p5Ref.current) return;
          if (resizeRaf) cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(() => {
            resizeRaf = 0;
            const p = p5Ref.current;
            if (!el || !p) return;
            const w = Math.min(
              CANVAS_MAX_PX,
              Math.max(1, Math.round(el.clientWidth)),
            );
            const h = Math.min(
              CANVAS_MAX_PX,
              Math.max(1, Math.round(el.clientHeight)),
            );
            if (w === p.width && h === p.height) return;
            p.resizeCanvas(w, h);
            p.pixelDensity(1);
          });
        });
        resizeObserver.observe(el);
      });

      return () => {
        disposed = true;
        resizeObserver?.disconnect();
        p5instance?.remove();
        p5Ref.current = null;
        stageImages.clear();
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={["min-h-0 min-w-0", className].filter(Boolean).join(" ")}
        aria-label="Adventure preview"
      />
    );
  },
);

P5Canvas.displayName = "P5Canvas";

function drawBubble(
  p: p5Types,
  x: number,
  y: number,
  text: string,
  kind: "say" | "think",
) {
  p.push();
  p.resetMatrix();
  const pad = 8;
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const lines = text.split("\n").slice(0, 4);
  let tw = 40;
  for (const line of lines) {
    tw = Math.max(tw, p.textWidth(line));
  }
  const th = lines.length * 16;
  const w = Math.min(p.width - 16, tw + pad * 2);
  const h = th + pad * 2;
  let bx = x + 24;
  let by = y - h - 36;
  bx = Math.max(8, Math.min(bx, p.width - w - 8));
  by = Math.max(8, by);
  p.fill(255);
  p.stroke(30);
  p.strokeWeight(1.5);
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  if (kind === "think") {
    ctx.setLineDash([3, 3]);
  }
  p.rect(bx, by, w, h, 8);
  ctx.setLineDash([]);
  p.fill(17, 24, 39);
  p.noStroke();
  let ly = by + pad;
  for (const line of lines) {
    p.text(line, bx + pad, ly);
    ly += 16;
  }
  p.pop();
}

/** Light dot pattern on solid backdrops (Scratch-style stage). */
function drawDotsBackground(p: p5Types) {
  const step = 40;
  const maxSpan = CANVAS_MAX_PX;
  const gw = Math.min(p.width, maxSpan);
  const gh = Math.min(p.height, maxSpan);
  const dotColor = { r: 203, g: 213, b: 225 };
  const dotDiameter = 2.5;
  p.noStroke();
  p.fill(dotColor.r, dotColor.g, dotColor.b);
  for (let x = 0; x <= gw; x += step) {
    for (let y = 0; y <= gh; y += step) {
      p.circle(x, y, dotDiameter);
    }
  }
}

function waitMs(ms: number, shouldCancel?: () => boolean) {
  return new Promise<void>((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (shouldCancel?.()) {
        resolve();
        return;
      }
      const elapsed = Date.now() - start;
      if (elapsed >= ms) {
        resolve();
        return;
      }
      setTimeout(tick, Math.min(50, ms - elapsed));
    };
    tick();
  });
}

/** Yields so keyboard / pointer sensing updates between Scratch-style `forever` iterations. */
function waitNextAnimationFrame(shouldCancel?: () => boolean) {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      if (shouldCancel?.()) {
        resolve();
        return;
      }
      resolve();
    });
  });
}

type MoveBobOpts = {
  amplitude: number;
  cycles: number;
};

function animateMove(
  sprite: Sprite,
  tx: number,
  ty: number,
  totalFrames: number,
  shouldCancel?: () => boolean,
  bob?: MoveBobOpts,
) {
  const sx = sprite.x;
  const sy = sprite.y;
  let frame = 0;
  const sheetDef = getCostumeById(sprite.costume) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  const sheetCells =
    sprite.paintedCostumeSrc?.trim()
      ? 0
      : sheetDef.kind === "image" && sheetDef.spriteSheet
        ? Math.max(
            1,
            sheetDef.spriteSheet.columns * sheetDef.spriteSheet.rows,
          )
        : 0;
  return new Promise<void>((resolve) => {
    const step = () => {
      if (shouldCancel?.()) {
        resolve();
        return;
      }
      frame += 1;
      const t = Math.min(1, frame / totalFrames);
      const baseX = sx + (tx - sx) * t;
      const baseY = sy + (ty - sy) * t;
      let y = baseY;
      if (bob) {
        const envelope = Math.sin(t * Math.PI);
        const stride = Math.sin(t * Math.PI * 2 * bob.cycles);
        y += envelope * stride * bob.amplitude;
      }
      if (sheetCells > 0) {
        const idx = Math.max(0, frame - 1);
        const denom = Math.max(1, totalFrames - 1);
        const phase = totalFrames <= 1 ? 1 : idx / denom;
        sprite.sheetFrame =
          Math.floor(phase * sheetCells) % sheetCells;
      }
      sprite.x = baseX;
      sprite.y = y;
      if (frame >= totalFrames) {
        sprite.x = tx;
        sprite.y = ty;
        if (sheetCells > 0) {
          sprite.sheetFrame = defaultSheetFrameForCostumeId(sprite.costume);
        }
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
