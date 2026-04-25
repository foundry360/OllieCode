function FilledSparkSvg({ values }: Readonly<{ values: readonly number[] }>) {
  const w = 128;
  const h = 48;
  const padX = 2;
  const padY = 4;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const n = values.length;
  const maxV = Math.max(1, ...values);
  const coords = values.map((v, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH - (v / maxV) * innerH;
    return { x, y };
  });
  const lineD =
    coords.length === 0
      ? ""
      : `M ${coords.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const baseY = padY + innerH;
  const firstX = coords[0]?.x ?? padX;
  const lastX = coords[coords.length - 1]?.x ?? w - padX;
  const areaD =
    coords.length === 0 ? "" : `${lineD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

  const mint = "#84c126";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="aspect-[8/3] h-auto w-full max-h-10 sm:max-h-11 lg:max-h-12"
      aria-hidden
    >
      <defs>
        <linearGradient id="learnerGrowthSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mint} stopOpacity={0.38} />
          <stop offset="100%" stopColor={mint} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      {areaD ? <path d={areaD} fill="url(#learnerGrowthSparkFill)" /> : null}
      {lineD ? (
        <path
          d={lineD}
          fill="none"
          stroke={mint}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

export function LearnerGrowthPanel({
  totalLearners,
  dailyNewSignups,
  changeLabel,
  changeTone,
}: Readonly<{
  totalLearners: number;
  dailyNewSignups: readonly number[];
  changeLabel: string;
  changeTone: "up" | "down" | "flat";
}>) {
  const toneClass =
    changeTone === "up" ? "text-[#84c126]" : changeTone === "down" ? "text-red-600" : "text-slate-600";
  const formattedTotal = new Intl.NumberFormat().format(totalLearners);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 lg:gap-4">
      <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
        <p className="m-0 min-w-0 leading-none">
          <span className="inline-flex max-w-full flex-nowrap items-baseline gap-x-1.5 sm:gap-x-2">
            <span className="font-display text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
              {formattedTotal}
            </span>
            <span
              className={`font-sans shrink-0 text-xs font-bold tabular-nums leading-snug sm:text-sm ${toneClass}`}
            >
              {changeLabel}
            </span>
          </span>
        </p>
        <p className="text-[0.65rem] font-semibold leading-snug text-slate-500 sm:text-xs">last 30 days</p>
      </div>
      <div className="flex w-full min-w-0 shrink-0 justify-center sm:w-24 sm:justify-end sm:pl-1 md:w-28 lg:w-32 lg:pl-2">
        <FilledSparkSvg values={dailyNewSignups} />
      </div>
    </div>
  );
}
