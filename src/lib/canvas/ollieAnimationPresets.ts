import type { OllieAction } from "@/types/ollie";

/** Must match {@link executeBlocks} `BASE_STEP_PX` (steps × this = move distance in px). */
const STEP_PX = 2.4;

export const OLLIE_ANIMATION_IDS = [
  "wave",
  "walk",
  "run",
  "jump",
] as const;

export type OllieAnimationId = (typeof OLLIE_ANIMATION_IDS)[number];

export function isOllieAnimationId(s: string): s is OllieAnimationId {
  return (OLLIE_ANIMATION_IDS as readonly string[]).includes(s);
}

export function animationDropdownOptions(): [string, string][] {
  return [
    ["wave", "wave"],
    ["walk", "walk"],
    ["run", "run"],
    ["jump", "jump"],
  ];
}

/**
 * Expand one “play animation” block into concrete stage actions.
 * Walk/run: `moveWithBob` bounce + sprite-sheet frames driven by move progress (see `P5Canvas.animateMove`).
 */
export function getAnimationPresetActions(id: string): OllieAction[] {
  if (!isOllieAnimationId(id)) return [];
  switch (id) {
    case "wave":
      return [
        { type: "rotate", degrees: { k: "n", v: -18 } },
        { type: "wait", ms: { k: "n", v: 90 } },
        { type: "rotate", degrees: { k: "n", v: 36 } },
        { type: "wait", ms: { k: "n", v: 90 } },
        { type: "rotate", degrees: { k: "n", v: -18 } },
      ];
    case "walk": {
      const step = 5 * STEP_PX;
      const out: OllieAction[] = [];
      for (let i = 0; i < 4; i += 1) {
        out.push({
          type: "moveWithBob",
          distance: { k: "n", v: step },
          style: "walk",
        });
      }
      return out;
    }
    case "run": {
      const step = 9 * STEP_PX;
      const out: OllieAction[] = [];
      for (let i = 0; i < 6; i += 1) {
        out.push({
          type: "moveWithBob",
          distance: { k: "n", v: step },
          style: "run",
        });
      }
      return out;
    }
    case "jump":
      return [
        {
          type: "jumpArc",
          peakYPct: { k: "n", v: 38 },
          halfSecs: { k: "n", v: 0.2 },
        },
      ];
    default:
      return [];
  }
}
