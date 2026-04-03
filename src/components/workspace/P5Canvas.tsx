"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type p5Types from "p5";
import type { OllieAction, OllieCostume } from "@/types/ollie";
import { playOllieSound } from "@/lib/sounds/ollieSounds";

export type P5CanvasHandle = {
  runActions: (actions: OllieAction[]) => Promise<void>;
  resetSprite: () => void;
};

type Sprite = {
  x: number;
  y: number;
  /** Degrees: 0 = up, 90 = right (Scratch-style stage) */
  heading: number;
  costume: OllieCostume;
  bubble?: { text: string; kind: "say" | "think"; until: number };
};

const MOVE_FRAMES = 18;

/** Keeps draw + resize cheap if layout reports an oversized box. */
const CANVAS_MAX_PX = 4096;

const CANVAS_BG = { r: 255, g: 255, b: 255 };

/** Default Ollie mascot — faces “up” when rotation is 0° (Scratch-style stage). */
const OLLIE_IMAGE_SRC = "/images/ollie.png";
const OLLIE_SPRITE_WIDTH = 88;

function normHeading(deg: number) {
  return ((deg % 360) + 360) % 360;
}

export const P5Canvas = forwardRef<P5CanvasHandle, { className?: string }>(
  function P5Canvas({ className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const p5Ref = useRef<p5Types | null>(null);
    const spriteRef = useRef<Sprite>({
      x: 0,
      y: 0,
      heading: 0,
      costume: "cat",
    });
    const runningRef = useRef(false);

    useImperativeHandle(ref, () => ({
      async runActions(actions: OllieAction[]) {
        if (runningRef.current) return;
        runningRef.current = true;
        const s = spriteRef.current;
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
            s.x = (a.xPct / 100) * cw;
            s.y = (a.yPct / 100) * ch;
          } else if (a.type === "glideTo") {
            const tx = (a.xPct / 100) * cw;
            const ty = (a.yPct / 100) * ch;
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
          } else if (a.type === "sound") {
            playOllieSound(a.id);
          } else if (a.type === "soundWait") {
            playOllieSound(a.id);
            await waitMs(a.ms);
          } else if (a.type === "wait") {
            await waitMs(a.ms);
          }
        }
        runningRef.current = false;
      },
      resetSprite() {
        const box = containerRef.current?.getBoundingClientRect();
        const w = Math.min(CANVAS_MAX_PX, Math.max(1, box?.width ?? 320));
        const h = Math.min(CANVAS_MAX_PX, Math.max(1, box?.height ?? 240));
        spriteRef.current = {
          x: w / 2,
          y: h / 2,
          heading: 0,
          costume: "cat",
        };
      },
    }));

    useEffect(() => {
      let disposed = false;
      let p5instance: p5Types | null = null;
      let resizeObserver: ResizeObserver | null = null;

      void import("p5").then((P5) => {
        if (disposed || !containerRef.current) return;
        const p5 = P5.default;

        const sketch = (p: p5Types) => {
          let ollieImg: p5Types.Image | null = null;

          p.setup = async () => {
            const el = containerRef.current!;
            const cw = Math.min(CANVAS_MAX_PX, Math.max(1, el.clientWidth));
            const ch = Math.min(CANVAS_MAX_PX, Math.max(1, el.clientHeight));
            p.createCanvas(cw, ch);
            p.angleMode(p.DEGREES);
            try {
              ollieImg = await p.loadImage(OLLIE_IMAGE_SRC);
            } catch {
              ollieImg = null;
            }
            spriteRef.current = {
              x: p.width / 2,
              y: p.height / 2,
              heading: 0,
              costume: "cat",
            };
          };

          p.draw = () => {
            p.background(CANVAS_BG.r, CANVAS_BG.g, CANVAS_BG.b);
            drawGrid(p);
            const s = spriteRef.current;
            p.push();
            p.translate(s.x, s.y);
            p.rotate(s.heading);
            p.imageMode(p.CENTER);
            if (s.costume === "cat") {
              if (ollieImg && ollieImg.width > 0) {
                const w = OLLIE_SPRITE_WIDTH;
                const h = w * (ollieImg.height / ollieImg.width);
                p.image(ollieImg, 0, 0, w, h);
              } else {
                p.stroke(255);
                p.strokeWeight(2);
                p.fill(132, 193, 38);
                p.triangle(0, -18, -14, 14, 14, 14);
              }
            } else if (s.costume === "square") {
              p.stroke(255);
              p.strokeWeight(2);
              p.fill(59, 130, 246);
              p.rectMode(p.CENTER);
              p.square(0, 0, 28);
            } else {
              p.stroke(255);
              p.strokeWeight(2);
              p.fill(244, 114, 182);
              p.circle(0, 0, 28);
            }
            p.pop();

            if (s.bubble && Date.now() < s.bubble.until) {
              drawBubble(p, s.x, s.y, s.bubble.text, s.bubble.kind);
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
            const w = Math.min(CANVAS_MAX_PX, Math.max(1, Math.round(el.clientWidth)));
            const h = Math.min(CANVAS_MAX_PX, Math.max(1, Math.round(el.clientHeight)));
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
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={className}
        aria-label="Canvas preview"
      />
    );
  },
);

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

function drawGrid(p: p5Types) {
  const step = 40;
  /** Avoid pathological frame cost if the canvas is sized incorrectly huge. */
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
