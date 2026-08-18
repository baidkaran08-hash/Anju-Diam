"use client";

import { useEffect, useRef, useState } from "react";

import { useCurrency } from "@/components/CurrencyProvider";
import { CURRENCIES, CURRENCY_META } from "@/lib/currency";

/**
 * Currency selector for the header.
 *
 * A real menu rather than a native <select>: the bar sits over the film and a
 * system select control cannot be styled to match, but it keeps the keyboard
 * and Escape behaviour a select would have given.
 */
export default function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${CURRENCY_META[currency].label}. Change currency`}
        className="label-sm flex items-center gap-1.5 py-1 transition-colors hover:text-gold"
      >
        <span aria-hidden>{CURRENCY_META[currency].symbol}</span>
        {currency}
        <svg
          viewBox="0 0 12 12"
          className={`h-2.5 w-2.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Currency"
          className={`glass glass-r-sm absolute z-50 mt-3 min-w-52 overflow-hidden py-1.5 ${
            compact ? "left-0" : "right-0"
          }`}
        >
          {CURRENCIES.map((code) => {
            const meta = CURRENCY_META[code];
            const selected = code === currency;

            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setCurrency(code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition-colors ${
                    selected ? "text-gold" : "text-ivory/75 hover:text-gold"
                  }`}
                >
                  <span className="label-sm">
                    <span className="mr-2" aria-hidden>
                      {meta.symbol}
                    </span>
                    {code}
                  </span>
                  <span className="text-[11px] font-light opacity-65">{meta.country}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
