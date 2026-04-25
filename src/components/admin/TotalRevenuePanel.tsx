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
    return <p className="text-sm leading-relaxed text-slate-600">{unavailableMessage}</p>;
  }

  const formatted = revenueCents !== null ? formatStripeCentsAsCurrency(revenueCents, currency) : "—";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 shrink-0 space-y-2">
        <p className="font-display text-3xl font-bold tabular-nums text-slate-900">{formatted}</p>
        {chargeCount !== null && chargeCount > 0 ? (
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{chargeCount}</span> succeeded charge
            {chargeCount === 1 ? "" : "s"}
          </p>
        ) : null}
        {skippedNonPrimaryCurrency ? (
          <p className="text-xs text-amber-700">
            Some charges in other currencies were omitted; total is {currency.toUpperCase()} only.
          </p>
        ) : null}
      </div>
    </div>
  );
}
