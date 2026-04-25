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
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="aspect-[8/3] h-auto w-full max-h-10 sm:max-h-11 lg:max-h-12"
      aria-hidden
    >
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
    return (
      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{unavailableMessage}</p>
    );
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
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 lg:gap-4">
      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
        {mrrTrend ? (
          <div className="space-y-1 sm:space-y-1.5">
            <p className="m-0 min-w-0 leading-none">
              <span className="inline-flex max-w-full flex-nowrap items-baseline gap-x-1.5 sm:gap-x-2">
                <span className="font-display text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                  {formatted}
                </span>
                <span
                  className={`font-sans text-xs font-bold tabular-nums leading-snug sm:text-sm ${trendToneClass}`}
                >
                  {mrrTrend.label}
                </span>
              </span>
            </p>
            <p className="text-[0.65rem] font-semibold leading-snug text-slate-500 sm:text-xs">last 30 days</p>
          </div>
        ) : (
          <p className="font-display text-xl font-bold leading-none tabular-nums text-slate-900 sm:text-2xl">
            {formatted}
          </p>
        )}
        {skippedNonPrimaryCurrency ? (
          <p className="text-[0.65rem] leading-snug text-amber-700 sm:text-xs">
            Some prices in other currencies were omitted; total is {currency.toUpperCase()} only.
          </p>
        ) : null}
        {(skippedNonRecurringItems ?? 0) > 0 || (skippedMeteredItems ?? 0) > 0 ? (
          <p className="text-[0.65rem] leading-snug text-slate-500 sm:text-xs">
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
        <div className="flex w-full min-w-0 shrink-0 justify-center sm:w-24 sm:justify-end sm:pl-1 md:w-28 lg:w-32 lg:pl-2">
          <ArrSparkSvg values={dailyArrCents} />
        </div>
      ) : null}
    </div>
  );
}
