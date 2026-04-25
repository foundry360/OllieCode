function ChurnSparkSvg({ values }: Readonly<{ values: readonly number[] }>) {
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

  const stroke = "#e11d48";
  const fillTop = "#f43f5e";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-32 shrink-0" width={128} height={48} aria-hidden>
      <defs>
        <linearGradient id="churnSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} stopOpacity={0.38} />
          <stop offset="100%" stopColor={fillTop} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      {areaD ? <path d={areaD} fill="url(#churnSparkFill)" /> : null}
      {lineD ? (
        <path
          d={lineD}
          fill="none"
          stroke={stroke}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

export function ChurnPanel({
  totalCanceled,
  dailyChurnByUpdateDay,
  changeLabel,
  sentiment,
}: Readonly<{
  totalCanceled: number;
  dailyChurnByUpdateDay: readonly number[];
  changeLabel: string;
  sentiment: "better" | "worse" | "flat";
}>) {
  const formattedTotal = new Intl.NumberFormat().format(totalCanceled);
  const toneClass =
    sentiment === "worse" ? "text-red-600" : sentiment === "better" ? "text-[#84c126]" : "text-slate-600";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 shrink-0">
        <p className="font-display text-3xl font-bold tabular-nums text-slate-900">{formattedTotal}</p>
        <div className="mt-2 space-y-0.5">
          <p className={`text-base font-bold tabular-nums ${toneClass}`}>{changeLabel}</p>
          <p className="text-xs font-semibold text-slate-500">last 30 days</p>
        </div>
      </div>
      <div className="flex items-end justify-end sm:pl-4">
        <ChurnSparkSvg values={dailyChurnByUpdateDay} />
      </div>
    </div>
  );
}
