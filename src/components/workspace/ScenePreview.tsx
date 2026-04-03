"use client";

import type { CSSProperties } from "react";
import type { SceneDef } from "@/lib/canvas/stageAssets";

type ScenePreviewProps = {
  scene: SceneDef;
  className?: string;
};

/**
 * Visual thumbnail for a scene — solid + optional dot grid, or backdrop image.
 */
export function ScenePreview({ scene, className = "" }: ScenePreviewProps) {
  if (scene.kind === "image") {
    return (
      <img
        src={scene.src}
        alt=""
        className={`block h-full w-full object-cover ${className}`.trim()}
        draggable={false}
      />
    );
  }

  const [r, g, b] = scene.rgb;
  const style: CSSProperties = {
    backgroundColor: `rgb(${r},${g},${b})`,
    ...(scene.grid
      ? {
          backgroundImage:
            "radial-gradient(circle, rgba(148, 163, 184, 0.42) 1px, transparent 1.5px)",
          backgroundSize: "10px 10px",
        }
      : {}),
  };

  return (
    <div
      className={`h-full w-full ${className}`.trim()}
      style={style}
      aria-hidden
    />
  );
}
