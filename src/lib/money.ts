/** Prices are stored in the smallest currency unit. Format only at the edges. */
export function formatPrice(minor: number, currency = "THB", locale = "en-TH") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
