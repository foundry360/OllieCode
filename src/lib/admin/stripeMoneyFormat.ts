/** ISO 4217 currencies Stripe treats as zero-decimal (whole units, no cents). */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

function fractionDigitsForCurrency(currency: string): {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
} {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
}

/** Format Stripe smallest-unit amounts (e.g. USD cents) for admin UI. */
export function formatStripeCentsAsCurrency(cents: number, currency: string): string {
  const upper = currency.toUpperCase();
  const { minimumFractionDigits, maximumFractionDigits } = fractionDigitsForCurrency(upper);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: upper,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(cents / 100);
  } catch {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(cents / 100);
  }
}
