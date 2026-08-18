"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  COOKIE_NAME,
  CURRENCY_META,
  DEFAULT_CURRENCY,
  convert,
  formatIn,
  type Currency,
  type Rates,
} from "@/lib/currency";

/**
 * Display currency.
 *
 * The selected currency and the rates are read on the server and passed in as
 * props, so the very first server-rendered paint is already in the visitor's
 * currency. Reading the cookie on the client instead would render every price
 * in baht and then flip it on hydration, which looks broken and is worse than
 * not offering the feature.
 */

type Ctx = {
  currency: Currency;
  rates: Rates;
  setCurrency: (next: Currency) => void;
  /** Formatted for display, converted from THB satang. */
  format: (minorTHB: number) => string;
  /** Whole units in the display currency — for input defaults and filters. */
  amount: (minorTHB: number) => number;
  /** Whole THB from an amount the visitor typed in the display currency. */
  toTHB: (amountInDisplay: number) => number;
  /** True when prices on screen are a conversion rather than the settled price. */
  isConverted: boolean;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({
  initialCurrency,
  rates,
  children,
}: {
  initialCurrency: Currency;
  rates: Rates;
  children: ReactNode;
}) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    // Not httpOnly on purpose: it is a display preference, not a credential,
    // and the switcher has to be able to set it without a round trip.
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      currency,
      rates,
      setCurrency,
      format: (minorTHB: number) => formatIn(minorTHB, currency, rates),
      amount: (minorTHB: number) => convert(minorTHB, currency, rates),
      toTHB: (amountInDisplay: number) => Math.round(amountInDisplay / (rates[currency] || 1)),
      isConverted: currency !== DEFAULT_CURRENCY,
    }),
    [currency, rates, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside <CurrencyProvider>.");
  return context;
}

/**
 * A price, in whatever currency the visitor has chosen.
 *
 * Always takes THB satang — the amount the database holds. Nothing else in the
 * app should be doing currency maths.
 */
export function Price({
  minor,
  className,
  title,
}: {
  minor: number;
  className?: string;
  title?: string;
}) {
  const { format, currency, isConverted } = useCurrency();

  return (
    <span
      className={className}
      // Screen readers and hover both get the real number when it is a conversion.
      title={title ?? (isConverted ? `Approximately — settled in Thai baht` : undefined)}
      data-currency={currency}
    >
      {isConverted ? "≈ " : ""}
      {format(minor)}
    </span>
  );
}

/** The one-line caveat shown wherever a converted total is committed to. */
export function ConversionNote({ className = "" }: { className?: string }) {
  const { currency, isConverted } = useCurrency();
  if (!isConverted) return null;

  return (
    <p className={`text-xs font-light leading-relaxed ${className}`}>
      Shown in {CURRENCY_META[currency].label} at today&rsquo;s rate, for guidance. Every piece is
      quoted and settled in Thai baht.
    </p>
  );
}
