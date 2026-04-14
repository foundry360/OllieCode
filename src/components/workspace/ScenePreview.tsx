"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { SceneDef } from "@/lib/canvas/stageAssets";

type ScenePreviewProps = {
  scene: SceneDef;
  className?: string;
};

function scenePreviewKey(scene: SceneDef): string {
  if (scene.kind === "image") return scene.src;
  return `solid-${scene.rgb[0]}-${scene.rgb[1]}-${scene.rgb[2]}`;
}

/**
 * Visual thumbnail for a scene — solid + optional dot grid, or backdrop image.
 */
export function ScenePreview({ scene, className = "" }: ScenePreviewProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const key = scenePreviewKey(scene);

  useEffect(() => {
    setImgFailed(false);
  }, [key]);

  if (scene.kind === "image") {
    if (imgFailed && scene.fallbackRgb) {
      const [r, g, b] = scene.fallbackRgb;
      return (
        <div
          className={`h-full w-full ${className}`.trim()}
          style={{
            backgroundColor: `rgb(${String(r)},${String(g)},${String(b)})`,
          }}
          aria-hidden
        />
      );
    }
    return (
      <img
        src={scene.src}
        alt=""
        className={`block h-full min-h-0 w-full object-cover ${className}`.trim()}
        draggable={false}
        onError={() => setImgFailed(true)}
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
