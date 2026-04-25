import { formatStripeCentsAsCurrency } from "@/lib/admin/stripeMoneyFormat";

function ArrSparkSvg({ values }: Readonly<{ values: readonly number[] }>) {
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
    coords.length === 0 ? "" : `M ${coords.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const baseY = padY + innerH;
  const firstX = coords[0]?.x ?? padX;
  const lastX = coords[coords.length - 1]?.x ?? w - padX;
  const areaD = coords.length === 0 ? "" : `${lineD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

  const mint = "#84c126";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-32 shrink-0" width={128} height={48} aria-hidden>
      <defs>
        <linearGradient id="arrSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mint} stopOpacity={0.38} />
          <stop offset="100%" stopColor={mint} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      {areaD ? <path d={areaD} fill="url(#arrSparkFill)" /> : null}
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

type ArrTrend = Readonly<{ label: string; tone: "up" | "down" | "flat" }>;

/** Annual recurring run rate (MRR × 12) with 30-day spark from daily MRR snapshots. */
export function ArrPanel({
  mrrCents,
  currency,
  dailyMrrCents,
  mrrTrend,
  skippedNonPrimaryCurrency,
  skippedNonRecurringItems,
  skippedMeteredItems,
  unavailableMessage,
}: Readonly<{
  mrrCents: number | null;
  currency: string;
  dailyMrrCents: readonly number[] | null;
  mrrTrend: ArrTrend | null;
  skippedNonPrimaryCurrency?: boolean;
  skippedNonRecurringItems?: number;
  skippedMeteredItems?: number;
  unavailableMessage?: string | null;
}>) {
  if (unavailableMessage) {
    return <p className="text-sm leading-relaxed text-slate-600">{unavailableMessage}</p>;
  }

  const arrCents = mrrCents !== null ? mrrCents * 12 : null;
  const formatted = arrCents !== null ? formatStripeCentsAsCurrency(arrCents, currency) : "—";

  const trendToneClass =
    mrrTrend?.tone === "up"
      ? "text-[#84c126]"
      : mrrTrend?.tone === "down"
        ? "text-red-600"
        : "text-slate-600";

  const dailyArrCents =
    dailyMrrCents !== null && dailyMrrCents.length > 0 ? dailyMrrCents.map((c) => c * 12) : null;
  const showSpark = dailyArrCents !== null && dailyArrCents.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 shrink-0 space-y-2">
        <p className="font-display text-3xl font-bold tabular-nums text-slate-900">{formatted}</p>
        {mrrTrend ? (
          <div className="space-y-0.5">
            <p className={`text-base font-bold tabular-nums ${trendToneClass}`}>{mrrTrend.label}</p>
            <p className="text-xs font-semibold text-slate-500">last 30 days</p>
          </div>
        ) : null}
        {skippedNonPrimaryCurrency ? (
          <p className="text-xs text-amber-700">
            Some prices in other currencies were omitted; total is {currency.toUpperCase()} only.
          </p>
        ) : null}
        {(skippedNonRecurringItems ?? 0) > 0 || (skippedMeteredItems ?? 0) > 0 ? (
          <p className="text-xs text-slate-500">
            {(skippedNonRecurringItems ?? 0) > 0 ? (
              <span>
                Skipped {(skippedNonRecurringItems ?? 0)} non-recurring line
                {(skippedNonRecurringItems ?? 0) === 1 ? "" : "s"}.
              </span>
            ) : null}
            {(skippedNonRecurringItems ?? 0) > 0 && (skippedMeteredItems ?? 0) > 0 ? " " : null}
            {(skippedMeteredItems ?? 0) > 0 ? (
              <span>
                Skipped {(skippedMeteredItems ?? 0)} metered line{(skippedMeteredItems ?? 0) === 1 ? "" : "s"}.
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      {showSpark ? (
        <div className="flex items-end justify-end sm:pl-4">
          <ArrSparkSvg values={dailyArrCents} />
        </div>
      ) : null}
    </div>
  );
}
