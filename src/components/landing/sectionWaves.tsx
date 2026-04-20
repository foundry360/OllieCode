/**
 * Shared two-cycle wave paths for landing section dividers.
 * "bottom" = wavy top edge of fill, flat bottom (sits at section bottom; fill is the *next* section color).
 * "top" = flat top of fill, wavy bottom (sits at section top; fill is the *previous* section color).
 */
const PATH_WAVE_BOTTOM_ANCHOR =
  "M0,40 C360,8 360,72 720,40 C1080,8 1080,72 1440,40 L1440,80 L0,80 Z";

const PATH_WAVE_TOP_ANCHOR =
  "M0,0 L1440,0 L1440,40 C1080,72 1080,8 720,40 C360,72 360,8 0,40 Z";

type LandingSectionWaveProps = {
  variant: "bottom" | "top";
  /** Sets `fill` via `currentColor` (e.g. `text-white`, `text-[#f7fee7]`). */
  colorClassName: string;
  className?: string;
};

export function LandingSectionWave({
  variant,
  colorClassName,
  className = "",
}: LandingSectionWaveProps) {
  const position = variant === "bottom" ? "bottom-0" : "top-0";
  const d = variant === "bottom" ? PATH_WAVE_BOTTOM_ANCHOR : PATH_WAVE_TOP_ANCHOR;

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 z-[1] ${position} ${colorClassName} ${className}`}
      aria-hidden
    >
      <svg
        className="block h-14 w-full sm:h-16 md:h-20"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        role="presentation"
      >
        <path fill="currentColor" d={d} />
      </svg>
    </div>
  );
}
