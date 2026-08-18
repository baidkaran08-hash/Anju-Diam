/**
 * Display currencies.
 *
 * The house sells in Thai baht and settles in Thai baht. These are a reading
 * convenience for the two other markets the client sells into — India and the
 * United States — so a visitor does not have to open a converter in another
 * tab to find out whether a piece is in their range.
 *
 * Everything downstream of the storefront stays in THB: the order record, the
 * emails, the studio, the books. A converted figure is never the number anyone
 * is charged, and the UI says so wherever it is shown.
 */

export const CURRENCIES = ["THB", "INR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "THB";

export type CurrencyMeta = {
  code: Currency;
  symbol: string;
  label: string;
  country: string;
  locale: string;
  /**
   * Converted prices are rounded to this many major units so they read as a
   * price rather than as the output of a calculator — ฿148,000 becoming
   * $4,482 helps nobody; $4,480 does.
   */
  step: number;
};

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  THB: { code: "THB", symbol: "฿", label: "Thai Baht", country: "Thailand", locale: "en-US", step: 1 },
  INR: { code: "INR", symbol: "₹", label: "Indian Rupee", country: "India", locale: "en-IN", step: 500 },
  USD: { code: "USD", symbol: "$", label: "US Dollar", country: "United States", locale: "en-US", step: 10 },
};

export type Rates = Record<Currency, number>;

/**
 * Used only when the live fetch fails. Deliberately a little conservative
 * against the house — a stale rate that slightly overstates the foreign price
 * is a smaller problem than one that understates it and disappoints at quote.
 */
export const FALLBACK_RATES: Rates = { THB: 1, INR: 2.9, USD: 0.0295 };

export const COOKIE_NAME = "ad_currency";

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/**
 * Converts a THB amount in satang to a whole-unit amount in `currency`,
 * rounded to that currency's presentation step.
 */
export function convert(minorTHB: number, currency: Currency, rates: Rates): number {
  const major = (minorTHB / 100) * (rates[currency] ?? 1);
  const { step } = CURRENCY_META[currency];
  return Math.round(major / step) * step;
}

export function formatIn(minorTHB: number, currency: Currency, rates: Rates): string {
  const meta = CURRENCY_META[currency];
  const amount = convert(minorTHB, currency, rates);
  return `${meta.symbol}${amount.toLocaleString(meta.locale, { maximumFractionDigits: 0 })}`;
}
