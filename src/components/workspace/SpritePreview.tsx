"use client";

import type { CostumeDef } from "@/lib/canvas/stageAssets";

type SpritePreviewProps = {
  costume: CostumeDef;
  className?: string;
};

/** Matches P5 stage sprite styling (see `P5Canvas` drawSpriteForCostume). */
export function SpritePreview({ costume, className = "" }: SpritePreviewProps) {
  if (costume.kind === "image") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#f1f5f9] ${className}`.trim()}
      >
        <img
          src={costume.src}
          alt=""
          className="max-h-[85%] max-w-[85%] object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (costume.shape === "square") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#f1f5f9] ${className}`.trim()}
      >
        <div
          className="aspect-square w-[55%] rounded-sm border-2 border-white shadow-sm"
          style={{ backgroundColor: "rgb(59, 130, 246)" }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[#f1f5f9] ${className}`.trim()}
    >
      <div
        className="aspect-square w-[55%] rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: "rgb(244, 114, 182)" }}
        aria-hidden
      />
    </div>
  );
}
