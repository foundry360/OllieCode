"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import {
  applyCostumeChromaKeyToCanvas,
  canvasToPngDataUrl,
} from "@/lib/canvas/spriteChromaKey";
import type { CostumeDef } from "@/lib/canvas/stageAssets";
import { resolveActorCostumeForDisplay } from "@/lib/canvas/actorCostumeDisplay";
import type { StageActor } from "@/types/ollie";

function useSpritePreviewDisplaySrc(costume: CostumeDef): {
  src: string;
  pending: boolean;
} {
  const base = costume.kind === "image" ? costume.src : "";
  const chroma =
    costume.kind === "image" && "chromaKey" in costume && costume.chromaKey
      ? costume.chromaKey
      : undefined;
  const [dataUrl, setDataUrl] = useState<string | null>(() =>
    chroma ? null : base,
  );

  useEffect(() => {
    if (!chroma) {
      setDataUrl(base);
      return;
    }
    let dead = false;
    setDataUrl(null);
    const im = new Image();
    im.onload = () => {
      if (dead) return;
      const c = applyCostumeChromaKeyToCanvas(im, im.width, im.height, chroma);
      setDataUrl(canvasToPngDataUrl(c));
    };
    im.onerror = () => {
      if (!dead) setDataUrl(base);
    };
    im.src = base;
    return () => {
      dead = true;
    };
  }, [base, chroma]);

  const pending = Boolean(chroma) && dataUrl === null;
  return { src: dataUrl ?? base, pending };
}

type SpritePreviewProps = {
  costume: CostumeDef;
  className?: string;
  /**
   * When true (e.g. Choose a sprite modal), zoom the first sprite-sheet cell to fill the tile
   * instead of shrinking the whole atlas with `object-contain` (which made Ollie tiny).
   */
  fillCard?: boolean;
};

/** Catalog costume or user-painted URL — matches stage / P5 display rules. */
export function StageActorCostumePreview({
  actor,
  className = "",
  fillCard = false,
}: {
  actor: StageActor;
  className?: string;
  fillCard?: boolean;
}) {
  const r = resolveActorCostumeForDisplay(actor);
  if (r.kind === "painted") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden bg-[#f1f5f9] ${className}`.trim()}
      >
        <img
          src={r.src}
          alt=""
          className={
            fillCard
              ? "h-full w-full max-h-full max-w-full object-contain p-2"
              : "max-h-[96%] max-w-[96%] object-contain"
          }
          draggable={false}
        />
      </div>
    );
  }
  return (
    <SpritePreview costume={r.def} fillCard={fillCard} className={className} />
  );
}

/** Matches P5 stage sprite styling (see `P5Canvas` drawSpriteForCostume). */
export function SpritePreview({
  costume,
  className = "",
  fillCard = false,
}: SpritePreviewProps) {
  const { src, pending } = useSpritePreviewDisplaySrc(costume);
  const sh = costume.spriteSheet;
  const isSheet = sh && (sh.columns > 1 || sh.rows > 1);

  if (fillCard && isSheet) {
    const c = sh.columns;
    const r = sh.rows;
    /** Scale the full sheet so one cell fills the tile (same idea as P5 `drawSpriteForCostume` frame 0). */
    const sheetStyle: CSSProperties = {
      backgroundImage: pending ? "none" : `url(${JSON.stringify(src)})`,
      backgroundSize: `${c * 100}% ${r * 100}%`,
      backgroundPosition: "left top",
      backgroundRepeat: "no-repeat",
    };
    return (
      <div
        className={`h-full w-full min-h-0 overflow-hidden bg-[#f1f5f9] ${className}`.trim()}
        style={sheetStyle}
        aria-hidden
      />
    );
  }

  const clip =
    isSheet && sh
      ? ({
          clipPath: `inset(0 ${100 - 100 / sh.columns}% ${100 - 100 / sh.rows}% 0)`,
        } satisfies CSSProperties)
      : undefined;

  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden bg-[#f1f5f9] ${className}`.trim()}
    >
      {pending ? null : (
        <img
          src={src}
          alt=""
          className={
            fillCard
              ? "h-full w-full max-h-full max-w-full object-contain p-2"
              : "max-h-[96%] max-w-[96%] object-contain"
          }
          style={clip}
          draggable={false}
        />
      )}
    </div>
  );
}
