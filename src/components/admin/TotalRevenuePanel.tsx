import { formatStripeCentsAsCurrency } from "@/lib/admin/stripeMoneyFormat";

/** Net succeeded Stripe charges (minus refunds) over the trailing window. */
export function TotalRevenuePanel({
  revenueCents,
  currency,
  chargeCount,
  skippedNonPrimaryCurrency,
  unavailableMessage,
}: Readonly<{
  revenueCents: number | null;
  currency: string;
  chargeCount: number | null;
  skippedNonPrimaryCurrency?: boolean;
  unavailableMessage?: string | null;
}>) {
  if (unavailableMessage) {
    return (
      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{unavailableMessage}</p>
    );
  }

  const formatted = revenueCents !== null ? formatStripeCentsAsCurrency(revenueCents, currency) : "—";

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 lg:gap-4">
      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
        <p className="font-display text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{formatted}</p>
        {chargeCount !== null && chargeCount > 0 ? (
          <p className="text-[0.65rem] leading-snug text-slate-500 sm:text-xs">
            <span className="font-semibold text-slate-700">{chargeCount}</span> succeeded charge
            {chargeCount === 1 ? "" : "s"}
          </p>
        ) : null}
        {skippedNonPrimaryCurrency ? (
          <p className="text-[0.65rem] leading-snug text-amber-700 sm:text-xs">
            Some charges in other currencies were omitted; total is {currency.toUpperCase()} only.
          </p>
        ) : null}
      </div>
    </div>
  );
}
