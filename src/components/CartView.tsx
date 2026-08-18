"use client";

import Link from "next/link";

import { useCart } from "@/components/CartProvider";
import { ProductArt } from "@/lib/product-art";
import { Price, ConversionNote } from "@/components/CurrencyProvider";
import { metalShortLabel, type Metal } from "@/lib/enums";

export default function CartView() {
  const { items, count, subtotalMinor, currency, ready, busy, setQuantity, clear } = useCart();

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy>
        {[0, 1].map((i) => (
          <div key={i} className="h-32 bg-stone/40 shimmering" />
        ))}
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="border border-graphite/12 py-24 text-center">
        <p className="display-md text-plum">Your selection is empty.</p>
        <p className="measure mx-auto mt-5 text-graphite/60">
          Nothing is held here yet. Everything we make is made to order, so take your time.
        </p>
        <Link href="/collections" className="btn-gold mt-10 inline-flex">
          Browse the collections
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <ul className="divide-y divide-graphite/12 border-y border-graphite/12">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-6 py-7">
              <Link
                href={`/products/${item.slug}`}
                className="relative block h-32 w-26 shrink-0 overflow-hidden bg-plum"
                style={{ width: "6.5rem" }}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <ProductArt product={item} tone="plum" title={item.name} className="h-full w-full" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-5">
                    <h3 className="display-sm">
                      <Link href={`/products/${item.slug}`} className="hover:text-wine">
                        {item.name}
                      </Link>
                    </h3>
                    <Price
                      minor={item.priceMinor * item.quantity}
                      className="shrink-0 text-sm font-light tabular-nums"
                    />
                  </div>

                  <p className="label-sm mt-2.5 text-graphite/45">
                    {item.diamondCaratW.toFixed(2)} ct ·{" "}
                    {metalShortLabel[item.metal as Metal] ?? item.metal} gold
                    {item.illusionSet && " · Illusion set"}
                  </p>

                  {item.note && (
                    <p className="mt-3 border-l border-gold/50 pl-3 text-sm font-light italic text-graphite/60">
                      {item.note}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-5">
                  <div className="flex items-center border border-graphite/18">
                    <button
                      type="button"
                      onClick={() => void setQuantity(item.productId, item.quantity - 1)}
                      disabled={busy}
                      aria-label={`Reduce quantity of ${item.name}`}
                      className="h-9 w-9 text-graphite/60 transition-colors hover:text-plum disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => void setQuantity(item.productId, item.quantity + 1)}
                      disabled={busy || item.quantity >= 10}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="h-9 w-9 text-graphite/60 transition-colors hover:text-plum disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void setQuantity(item.productId, 0)}
                    disabled={busy}
                    className="label-sm text-graphite/40 underline underline-offset-4 transition-colors hover:text-plum"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => void clear()}
          disabled={busy}
          className="label-sm mt-8 text-graphite/40 underline underline-offset-4 hover:text-plum"
        >
          Empty selection
        </button>
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass-light glass-r p-8 md:p-10">
          <h2 className="label mb-8 text-wine">Summary</h2>

          <dl className="space-y-4">
            <div className="flex justify-between gap-5">
              <dt className="text-sm font-light text-graphite/65">
                {count} {count === 1 ? "piece" : "pieces"}
              </dt>
              <dd><Price minor={subtotalMinor} className="text-sm tabular-nums" /></dd>
            </div>
            <div className="flex justify-between gap-5">
              <dt className="text-sm font-light text-graphite/65">Making &amp; finishing</dt>
              <dd className="text-sm text-graphite/50">Included</dd>
            </div>
            <div className="flex justify-between gap-5">
              <dt className="text-sm font-light text-graphite/65">Shipping</dt>
              <dd className="text-sm text-graphite/50">Quoted on confirmation</dd>
            </div>
          </dl>

          <div className="mt-8 flex items-baseline justify-between gap-5 border-t border-graphite/15 pt-6">
            <span className="label text-plum">Indicative total</span>
            <Price minor={subtotalMinor} className="text-xl font-light tabular-nums text-plum" />
          </div>

          <Link href="/checkout" className="btn-gold mt-9 w-full">
            Request these pieces
          </Link>

          <ConversionNote className="mt-6 text-graphite/55" />

          <p className="mt-4 text-xs font-light leading-relaxed text-graphite/55">
            No payment is taken here. Each piece is made to order, so the house confirms stone
            availability and final sizing with you before any money changes hands.
          </p>
        </div>

        <Link
          href="/collections"
          className="label link-rule mt-8 inline-block text-plum hover:text-wine"
        >
          Continue browsing
        </Link>
      </aside>
    </div>
  );
}
