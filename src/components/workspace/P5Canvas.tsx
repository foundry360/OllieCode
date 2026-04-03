"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type p5Types from "p5";
import type { OllieAction } from "@/types/ollie";
import { playOllieSound } from "@/lib/sounds/ollieSounds";

export type P5CanvasHandle = {
  /** Run the Blockly-generated action list with turtle-style motion + sounds. */
  runActions: (actions: OllieAction[]) => Promise<void>;
  resetSprite: () => void;
};

type Sprite = {
  x: number;
  y: number;
  /** Degrees: 0 = up, 90 = right (screen coords) */
  heading: number;
};

const MOVE_FRAMES = 18;

/** Muted light green canvas fill (RGB) */
const CANVAS_BG = { r: 226, g: 236, b: 220 };

/**
 * p5.js stage — sprite moves based on Blockly output.
 * Optional: wrap sprite position updates in GSAP.to() for easing (see comment below).
 * Optional: use Interact.js on a DOM overlay for draggable props outside Blockly (Interact.js).
 */
export const P5Canvas = forwardRef<P5CanvasHandle, { className?: string }>(
  function P5Canvas({ className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const p5Ref = useRef<p5Types | null>(null);
    const spriteRef = useRef<Sprite>({ x: 0, y: 0, heading: 0 });
    const runningRef = useRef(false);

    useImperativeHandle(ref, () => ({
      async runActions(actions: OllieAction[]) {
        if (runningRef.current) return;
        runningRef.current = true;
        const s = spriteRef.current;
        for (const a of actions) {
          if (a.type === "rotate") {
            s.heading = (s.heading + a.degrees) % 360;
          } else if (a.type === "move") {
            const rad = (s.heading * Math.PI) / 180;
            const dx = Math.sin(rad) * a.distance;
            const dy = -Math.cos(rad) * a.distance;
            const tx = s.x + dx;
            const ty = s.y + dy;
            await animateMove(s, tx, ty);
          } else if (a.type === "sound") {
            playOllieSound(a.id);
          } else if (a.type === "wait") {
            await waitMs(a.ms);
          }
        }
        runningRef.current = false;
      },
      resetSprite() {
        const box = containerRef.current?.getBoundingClientRect();
        const w = box?.width ?? 320;
        const h = box?.height ?? 240;
        spriteRef.current = { x: w / 2, y: h / 2, heading: 0 };
      },
    }));

    useEffect(() => {
      let disposed = false;
      let p5instance: p5Types | null = null;

      void import("p5").then((P5) => {
        if (disposed || !containerRef.current) return;
        const p5 = P5.default;

        const sketch = (p: p5Types) => {
          p.setup = () => {
            p.createCanvas(
              containerRef.current!.clientWidth,
              containerRef.current!.clientHeight,
            );
            p.angleMode(p.DEGREES);
            spriteRef.current = {
              x: p.width / 2,
              y: p.height / 2,
              heading: 0,
            };
          };

          p.draw = () => {
            p.background(CANVAS_BG.r, CANVAS_BG.g, CANVAS_BG.b);
            drawGrid(p);
            const s = spriteRef.current;
            p.push();
            p.translate(s.x, s.y);
            p.rotate(s.heading);
            p.fill(132, 193, 38);
            p.stroke(255);
            p.strokeWeight(2);
            p.triangle(0, -18, -14, 14, 14, 14);
            p.pop();
          };

          p.windowResized = () => {
            if (!containerRef.current) return;
            p.resizeCanvas(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight,
            );
          };
        };

        p5instance = new p5(sketch, containerRef.current);
        p5Ref.current = p5instance;
      });

      return () => {
        disposed = true;
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

function drawGrid(p: p5Types) {
  const step = 40;
  const dotColor = { r: 168, g: 188, b: 158 };
  const dotDiameter = 2.5;
  p.noStroke();
  p.fill(dotColor.r, dotColor.g, dotColor.b);
  for (let x = 0; x <= p.width; x += step) {
    for (let y = 0; y <= p.height; y += step) {
      p.circle(x, y, dotDiameter);
    }
  }
}

function waitMs(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Linear interpolation over MOVE_FRAMES — swap for GSAP:
 * import gsap from 'gsap';
 * gsap.to(sprite, { duration: 0.25, x: tx, y: ty, ease: 'back.out' });
 */
function animateMove(sprite: Sprite, tx: number, ty: number) {
  const sx = sprite.x;
  const sy = sprite.y;
  let frame = 0;
  return new Promise<void>((resolve) => {
    const step = () => {
      frame += 1;
      const t = frame / MOVE_FRAMES;
      sprite.x = sx + (tx - sx) * t;
      sprite.y = sy + (ty - sy) * t;
      if (frame >= MOVE_FRAMES) {
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
