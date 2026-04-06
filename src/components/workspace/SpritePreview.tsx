"use client";

import type { CSSProperties } from "react";
import type { CostumeDef } from "@/lib/canvas/stageAssets";

type SpritePreviewProps = {
  costume: CostumeDef;
  className?: string;
  /**
   * When true (e.g. Choose a sprite modal), zoom the first sprite-sheet cell to fill the tile
   * instead of shrinking the whole atlas with `object-contain` (which made Ollie tiny).
   */
  fillCard?: boolean;
};

/** Matches P5 stage sprite styling (see `P5Canvas` drawSpriteForCostume). */
export function SpritePreview({
  costume,
  className = "",
  fillCard = false,
}: SpritePreviewProps) {
  const sh = costume.spriteSheet;
  const isSheet = sh && (sh.columns > 1 || sh.rows > 1);

  if (fillCard && isSheet) {
    const c = sh.columns;
    const r = sh.rows;
    return (
      <div
        className={`relative h-full w-full min-h-0 overflow-hidden bg-[#f1f5f9] ${className}`.trim()}
      >
        <img
          src={costume.src}
          alt=""
          className="pointer-events-none absolute left-0 top-0 max-h-none max-w-none select-none"
          style={{
            width: `${c * 100}%`,
            height: `${r * 100}%`,
            objectFit: "fill",
          }}
          draggable={false}
        />
      </div>
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
      <img
        src={costume.src}
        alt=""
        className={
          fillCard
            ? "h-full w-full max-h-full max-w-full object-contain p-2"
            : "max-h-[96%] max-w-[96%] object-contain"
        }
        style={clip}
        draggable={false}
      />
    </div>
  );
}
