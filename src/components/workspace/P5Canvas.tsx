"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type p5Types from "p5";
import type { OllieAction } from "@/types/ollie";
import {
  DEFAULT_COSTUME_ID,
  DEFAULT_SCENE_ID,
  collectStageImageUrls,
  getCostumeById,
  getSceneById,
} from "@/lib/canvas/stageAssets";
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import { playOllieSound } from "@/lib/sounds/ollieSounds";

export type StageActorPaint = { id: string; costumeId: OllieSpriteCostumeId };

export type P5CanvasHandle = {
  runParallel: (
    bundles: { spriteId: string; actions: OllieAction[] }[],
  ) => Promise<void>;
  resetSprite: () => void;
};

export type P5CanvasProps = {
  className?: string;
  sceneId: OllieSceneId;
  actors: StageActorPaint[];
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
  bubble?: { text: string; kind: "say" | "think"; until: number };
};

const MOVE_FRAMES = 18;
const CANVAS_MAX_PX = 4096;

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

function drawSceneLayer(
  p: p5Types,
  sceneId: OllieSceneId,
  images: Map<string, p5Types.Image>,
) {
  const scene = getSceneById(sceneId) ?? getSceneById(DEFAULT_SCENE_ID)!;
  if (scene.kind === "solid") {
    const [r, g, b] = scene.rgb;
    p.background(r, g, b);
    return;
  }
  const img = images.get(scene.src);
  if (img && img.width > 0) {
    p.background(0);
    p.imageMode(p.CORNER);
    p.image(img, 0, 0, p.width, p.height);
    p.imageMode(p.CENTER);
  } else {
    const [r, g, b] = scene.fallbackRgb;
    p.background(r, g, b);
  }
}

function drawSpriteForCostume(
  p: p5Types,
  costumeId: OllieSpriteCostumeId,
  images: Map<string, p5Types.Image>,
) {
  const def = getCostumeById(costumeId) ?? getCostumeById(DEFAULT_COSTUME_ID)!;
  if (def.kind === "image") {
    const img = images.get(def.src);
    if (img && img.width > 0) {
      const w = def.width;
      const h = w * (img.height / img.width);
      p.image(img, 0, 0, w, h);
    } else {
      p.stroke(255);
      p.strokeWeight(2);
      p.fill(132, 193, 38);
      p.triangle(0, -18, -14, 14, 14, 14);
    }
    return;
  }
  if (def.shape === "square") {
    p.stroke(255);
    p.strokeWeight(2);
    p.fill(59, 130, 246);
    p.rectMode(p.CENTER);
    p.square(0, 0, 28);
    return;
  }
  p.stroke(255);
  p.strokeWeight(2);
  p.fill(244, 114, 182);
  p.circle(0, 0, 28);
}

export const P5Canvas = forwardRef<P5CanvasHandle, P5CanvasProps>(
  function P5Canvas(
    { className, sceneId, actors, onSceneChange, onActorCostumeChange },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const p5Ref = useRef<p5Types | null>(null);
    const spritesByIdRef = useRef<Map<string, Sprite>>(new Map());
    const currentSceneRef = useRef<OllieSceneId>(sceneId);
    const runningRef = useRef(false);
    const onSceneChangeRef = useRef(onSceneChange);
    const onActorCostumeChangeRef = useRef(onActorCostumeChange);
    const actorsRef = useRef(actors);
    onSceneChangeRef.current = onSceneChange;
    onActorCostumeChangeRef.current = onActorCostumeChange;
    actorsRef.current = actors;

    const latestSceneIdRef = useRef(sceneId);
    latestSceneIdRef.current = sceneId;

    useEffect(() => {
      currentSceneRef.current = sceneId;
    }, [sceneId]);

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
        if (!ids.has(id)) map.delete(id);
      }
      actors.forEach((a, i) => {
        const existing = map.get(a.id);
        if (existing) {
          existing.costume = a.costumeId;
        } else {
          const pos = layoutSlot(i, actors.length, w, h);
          map.set(a.id, {
            x: pos.x,
            y: pos.y,
            heading: 0,
            costume: a.costumeId,
          });
        }
      });
    }, [actors]);

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
        if (a.type === "rotate") {
          s.heading = normHeading(s.heading + a.degrees);
        } else if (a.type === "setHeading") {
          s.heading = normHeading(a.degrees);
        } else if (a.type === "move") {
          const rad = (s.heading * Math.PI) / 180;
          const dx = Math.sin(rad) * a.distance;
          const dy = -Math.cos(rad) * a.distance;
          await animateMove(s, s.x + dx, s.y + dy, MOVE_FRAMES);
        } else if (a.type === "goTo") {
          const pos = scratchStageToPixel(a.xPct, a.yPct, cw, ch);
          s.x = pos.x;
          s.y = pos.y;
        } else if (a.type === "glideTo") {
          const { x: tx, y: ty } = scratchStageToPixel(a.xPct, a.yPct, cw, ch);
          await animateMove(
            s,
            tx,
            ty,
            Math.max(8, Math.round((a.secs * 1000) / 16)),
          );
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
          await waitMs(a.ms);
          s.bubble = undefined;
        } else if (a.type === "think") {
          s.bubble = {
            text: a.text,
            kind: "think",
            until: Date.now() + a.ms,
          };
          await waitMs(a.ms);
          s.bubble = undefined;
        } else if (a.type === "costume") {
          s.costume = a.id;
          onActorCostumeChangeRef.current(spriteId, a.id);
        } else if (a.type === "scene") {
          currentSceneRef.current = a.id;
          onSceneChangeRef.current(a.id);
        } else if (a.type === "sound") {
          playOllieSound(a.id);
        } else if (a.type === "soundWait") {
          playOllieSound(a.id);
          await waitMs(a.ms);
        } else if (a.type === "wait") {
          await waitMs(a.ms);
        }
      }
    }

    useImperativeHandle(ref, () => ({
      async runParallel(bundles: { spriteId: string; actions: OllieAction[] }[]) {
        if (runningRef.current) return;
        runningRef.current = true;
        try {
          await Promise.all(
            bundles.map(({ spriteId, actions }) =>
              runSequenceForSprite(spriteId, actions),
            ),
          );
        } finally {
          runningRef.current = false;
        }
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
          s.heading = 0;
          s.bubble = undefined;
          s.costume = a.costumeId;
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
                heading: 0,
                costume: a.costumeId,
              });
            });
          };

          p.draw = () => {
            const sid = currentSceneRef.current;
            const sceneMeta = getSceneById(sid) ?? getSceneById(DEFAULT_SCENE_ID)!;
            drawSceneLayer(p, sid, stageImages);
            if (sceneMeta.grid) {
              drawDotsBackground(p);
            }
            const order = actorsRef.current.map((a) => a.id);
            for (const id of order) {
              const s = spritesByIdRef.current.get(id);
              if (!s) continue;
              p.push();
              p.translate(s.x, s.y);
              p.rotate(s.heading);
              p.imageMode(p.CENTER);
              drawSpriteForCostume(p, s.costume, stageImages);
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

function waitMs(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function animateMove(
  sprite: Sprite,
  tx: number,
  ty: number,
  totalFrames: number,
) {
  const sx = sprite.x;
  const sy = sprite.y;
  let frame = 0;
  return new Promise<void>((resolve) => {
    const step = () => {
      frame += 1;
      const t = Math.min(1, frame / totalFrames);
      sprite.x = sx + (tx - sx) * t;
      sprite.y = sy + (ty - sy) * t;
      if (frame >= totalFrames) {
        sprite.x = tx;
        sprite.y = ty;
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
