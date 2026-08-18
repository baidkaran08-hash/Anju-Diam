/**
 * Money is stored and passed around as an integer of the smallest currency
 * unit (satang for THB). Nothing in this codebase should hold a price as a
 * float — a 0.1 + 0.2 rounding error on a six-figure baht piece is the kind of
 * bug that only shows up in an invoice.
 */

export function formatMoney(minor: number, currency = "THB", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    // narrowSymbol gives ฿148,000 rather than the ISO code THB 148,000, which
    // is what a shopper expects to see on a price.
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(minor / 100);
}

/** Compact form for dense grids: ฿148,000 rather than THB 148,000.00 */
export function formatMoneyCompact(minor: number, currency = "THB") {
  const symbol = currency === "THB" ? "฿" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(minor / 100).toLocaleString("en-US")}`;
}

export function toMinor(major: number) {
  return Math.round(major * 100);
}
