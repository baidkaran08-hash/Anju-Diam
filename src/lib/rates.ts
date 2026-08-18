import "server-only";

import { CURRENCIES, FALLBACK_RATES, type Currency, type Rates } from "@/lib/currency";

/**
 * Live exchange rates, based on THB.
 *
 * open.er-api.com is free and needs no key. The response is cached for twelve
 * hours by Next's fetch cache, so a busy day costs two requests, not two
 * thousand — and a rate that is half a day old is well inside the tolerance for
 * an indicative price on a made-to-order piece.
 *
 * If the request fails or returns something unexpected, the hard-coded
 * fallback is used rather than throwing. A storefront that will not render
 * because a currency API is down would be a poor trade.
 */
export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/THB", {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!response.ok) return FALLBACK_RATES;

    const payload = (await response.json()) as { result?: string; rates?: Record<string, number> };
    if (payload.result !== "success" || !payload.rates) return FALLBACK_RATES;

    const rates = { ...FALLBACK_RATES };
    for (const code of CURRENCIES) {
      const value = payload.rates[code];
      // Guard against a malformed or zeroed rate quietly wrecking every price.
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        rates[code as Currency] = value;
      }
    }
    rates.THB = 1;
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}
