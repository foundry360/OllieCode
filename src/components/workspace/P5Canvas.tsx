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
  evalSerializedBool,
  type SensingEvalContext,
} from "@/lib/blockly/sensingSerialize";
import {
  DEFAULT_COSTUME_ID,
  DEFAULT_SCENE_ID,
  collectStageImageUrls,
  getCostumeById,
  getSceneById,
  migrateCostumeIdFromStorage,
  nextOllieSpriteCostumeId,
  normalizeSceneLayerIdsFromPayload,
} from "@/lib/canvas/stageAssets";
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import { playOllieSound } from "@/lib/sounds/ollieSounds";

export type StageActorPaint = { id: string; costumeId: OllieSpriteCostumeId };

export type P5CanvasHandle = {
  /** Run green-flag scripts, then keep key / stage / backdrop / broadcast handlers until the next run. */
  runProjectPlans: (
    plans: { spriteId: string; plan: SpriteScriptPlan }[],
  ) => Promise<{ aborted: boolean }>;
  /** Request an immediate stop of in-flight scripts (same effect as the “stop all” block). */
  stopRun: () => void;
  resetSprite: () => void;
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
  ) => void;
};

type Sprite = {
  x: number;
  y: number;
  heading: number;
  costume: OllieSpriteCostumeId;
  /** Frame index for image costumes with `spriteSheet` (walk/run advances this). */
  sheetFrame: number;
  bubble?: { text: string; kind: "say" | "think"; until: number };
};

const MOVE_FRAMES = 18;
const CANVAS_MAX_PX = 4096;

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

async function loadStageImage(
  p: p5Types,
  url: string,
  stageImages: Map<string, p5Types.Image>,
) {
  try {
    const img = await p.loadImage(url);
    if (img && img.width > 0) {
      stageImages.set(url, img);
      return;
    }
  } catch {
    /* try DOM path */
  }
  const fallback = await loadSvgOrRasterViaDom(p, url);
  if (fallback) stageImages.set(url, fallback);
}

function normHeading(deg: number) {
  return ((deg % 360) + 360) % 360;
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
  const def =
    getCostumeById(s.costume) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  const img = images.get(def.src);
  if (!img || img.width <= 0) {
    return { rotationDeg: normHeading(s.heading), mirrorX: false };
  }
  const off =
    typeof def.spriteRotationOffsetDeg === "number"
      ? def.spriteRotationOffsetDeg
      : 0;
  const net = normHeading(s.heading + off);
  if (off !== 0 && net === 180) {
    return { rotationDeg: 0, mirrorX: true };
  }
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
      return e.key === "ArrowUp";
    case "down":
      return e.key === "ArrowDown";
    case "left":
      return e.key === "ArrowLeft";
    case "right":
      return e.key === "ArrowRight";
    default:
      return (
        e.key.length === 1 && e.key.toLowerCase() === keyId.toLowerCase()
      );
  }
}

/** Normalized key id for Sensing — must match {@link keyEventMatches} / toolbox dropdowns. */
function keyIdFromKeyboardEvent(e: KeyboardEvent): string | null {
  if (e.code === "Space" || e.key === " ") return "space";
  if (e.key === "ArrowUp") return "up";
  if (e.key === "ArrowDown") return "down";
  if (e.key === "ArrowLeft") return "left";
  if (e.key === "ArrowRight") return "right";
  if (e.key.length === 1) return e.key.toLowerCase();
  return null;
}

function drawSpriteForCostume(
  p: p5Types,
  sprite: Sprite,
  images: Map<string, p5Types.Image>,
) {
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
    const actorsRef = useRef(actors);
    onSceneChangeRef.current = onSceneChange;
    onActorCostumeChangeRef.current = onActorCostumeChange;
    actorsRef.current = actors;

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
        const existing = map.get(a.id);
        if (existing) {
          if (!pauseActorCostumePropSync) {
            if (existing.costume !== a.costumeId) {
              existing.sheetFrame = 0;
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
            sheetFrame: 0,
          });
        }
      });
    }, [actors, pauseActorCostumePropSync]);

    useImperativeHandle(ref, () => ({
      async runProjectPlans(
        plans: { spriteId: string; plan: SpriteScriptPlan }[],
      ) {
        if (runningRef.current) return { aborted: false };
        if (keyDownHandlerRef.current) {
          window.removeEventListener("keydown", keyDownHandlerRef.current);
          keyDownHandlerRef.current = null;
        }
        sessionActiveRef.current = false;
        backdropPackRef.current = null;
        stageClickHandlerRef.current = null;

        runningRef.current = true;
        abortRunRef.current = false;
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
        window.addEventListener("keydown", onSensingKeyDown);
        window.addEventListener("keyup", onSensingKeyUp);

        function buildSensingCtx(sid: string): SensingEvalContext | null {
          const sprite = spritesByIdRef.current.get(sid);
          if (!sprite) return null;
          const box = containerRef.current?.getBoundingClientRect();
          const cw = Math.min(CANVAS_MAX_PX, Math.max(1, box?.width ?? 400));
          const ch = Math.min(CANVAS_MAX_PX, Math.max(1, box?.height ?? 300));
          const p = p5Ref.current;
          return {
            cw,
            ch,
            spriteId: sid,
            spriteX: sprite.x,
            spriteY: sprite.y,
            mouseX: p?.mouseX ?? 0,
            mouseY: p?.mouseY ?? 0,
            mouseIsPressed: p?.mouseIsPressed ?? false,
            keysDown: keysHeldRef.current,
            timerSecs: (performance.now() - timerStartMsRef.current) / 1000,
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
          const cw = Math.min(CANVAS_MAX_PX, Math.max(1, box?.width ?? 400));
          const ch = Math.min(CANVAS_MAX_PX, Math.max(1, box?.height ?? 300));

          for (const a of actions) {
            if (shouldCancel()) return;
            if (a.type === "rotate") {
              s.heading = normHeading(s.heading + a.degrees);
            } else if (a.type === "setHeading") {
              s.heading = normHeading(a.degrees);
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
            } else if (a.type === "think") {
              s.bubble = {
                text: a.text,
                kind: "think",
                until: Date.now() + a.ms,
              };
              await waitMs(a.ms, shouldCancel);
              s.bubble = undefined;
            } else if (a.type === "costume") {
              const id = migrateCostumeIdFromStorage(a.id);
              s.costume = id;
              s.sheetFrame = 0;
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
                  s.sheetFrame = 0;
                  onActorCostumeChangeRef.current(spriteId, nextId);
                }
              }
            } else if (a.type === "scene") {
              currentSceneRef.current = a.id;
              latestSceneLayerIdsRef.current = [a.id];
              onSceneChangeRef.current(a.id);
            } else if (a.type === "sound") {
              playOllieSound(a.id);
            } else if (a.type === "soundWait") {
              playOllieSound(a.id);
              await waitMs(a.ms, shouldCancel);
            } else if (a.type === "wait") {
              await waitMs(a.ms, shouldCancel);
            } else if (a.type === "broadcast") {
              void dispatchBroadcast(a.message, false);
            } else if (a.type === "broadcastWait") {
              await dispatchBroadcast(a.message, true);
            } else if (a.type === "stop") {
              if (a.scope === "all") {
                stopAllScripts = true;
                return;
              }
              return;
            }
          }
        }

        sessionActiveRef.current = true;
        backdropPackRef.current = { plans, runSequence: runSequenceForSprite };

        const keyHandler = (e: KeyboardEvent) => {
          for (const { spriteId: sid, plan } of plans) {
            for (const ks of plan.keyScripts) {
              if (keyEventMatches(ks.keyId, e)) {
                e.preventDefault();
                void runSequenceForSprite(sid, ks.actions);
              }
            }
          }
        };
        keyDownHandlerRef.current = keyHandler;
        window.addEventListener("keydown", keyHandler);

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
          window.removeEventListener("keydown", onSensingKeyDown);
          window.removeEventListener("keyup", onSensingKeyUp);
          aborted = abortRunRef.current;
          abortRunRef.current = false;
          runningRef.current = false;
        }
        return { aborted };
      },
      stopRun() {
        abortRunRef.current = true;
      },
      resetSprite() {
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
          s.sheetFrame = 0;
        });
      },
    }));

    useEffect(() => {
      let disposed = false;
      let p5instance: p5Types | null = null;
      let resizeObserver: ResizeObserver | null = null;
      const stageImages = new Map<string, p5Types.Image>();

      void import("p5").then((P5) => {
        if (disposed || !containerRef.current) return;
        const p5 = P5.default;

        const sketch = (p: p5Types) => {
          p.setup = async () => {
            const el = containerRef.current!;
            const cw = Math.min(CANVAS_MAX_PX, Math.max(1, el.clientWidth));
            const ch = Math.min(CANVAS_MAX_PX, Math.max(1, el.clientHeight));
            p.createCanvas(cw, ch);
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
                sheetFrame: 0,
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
              if (!s) continue;
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
              if (s?.bubble && Date.now() < s.bubble.until) {
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
        className={className}
        aria-label="Mission preview"
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
    sheetDef.kind === "image" && sheetDef.spriteSheet
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
          sprite.sheetFrame = 0;
        }
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
