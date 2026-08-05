"use client";

import { useEffect, useState } from "react";
import { METAL_LABELS } from "@/lib/catalogue";

type Product = {
  id: string;
  slug: string;
  name: string;
  priceMinor: number;
  currency: string;
  metal: string;
  diamondCaratW: number;
  diamondColour: string;
  diamondClarity: string;
  images: string[];
};

const format = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-TH", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    minor / 100,
  );

/**
 * Reads the catalogue through /api/products so the filter, sort and search
 * behaviour is the API's, not a second implementation that can drift from it.
 */
export default function CollectionBrowser({
  category,
  fallbackImage,
}: {
  category?: string;
  fallbackImage: string;
}) {
  const [query, setQuery] = useState("");
  const [metal, setMetal] = useState("");
  const [sort, setSort] = useState("newest");
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    // Debounced so typing does not fire a request per keystroke.
    const timer = setTimeout(async () => {
      setState("loading");
      const params = new URLSearchParams({ sort, perPage: "24" });
      if (category) params.set("category", category);
      if (metal) params.set("metal", metal);
      if (query.trim()) params.set("q", query.trim());

      try {
        const response = await fetch(`/api/products?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("request failed");
        const data = await response.json();
        setItems(data.items);
        setTotal(data.total);
        setState("ready");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState("error");
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, metal, sort, category]);

  const control =
    "min-h-11 rounded-lg border border-plum/20 bg-white/65 px-4 py-3 text-[13px] font-light text-charcoal";

  return (
    <div>
      <div className="glass mb-8 flex flex-wrap items-center gap-3 rounded-2xl p-4" role="search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pieces…"
          aria-label="Search pieces"
          className={`${control} min-w-44 flex-1`}
        />
        <select
          value={metal}
          onChange={(event) => setMetal(event.target.value)}
          aria-label="Filter by metal"
          className={control}
        >
          <option value="">All metals</option>
          {Object.entries(METAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort"
          className={control}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
          <option value="carat_desc">Carat, high to low</option>
        </select>
        <span className="label ml-auto text-wine" aria-live="polite">
          {state === "loading" ? "Loading…" : `${total} piece${total === 1 ? "" : "s"}`}
        </span>
      </div>

      {state === "error" && (
        <p className="py-14 text-center text-sm text-charcoal/70">
          The catalogue did not load. Refresh the page to try again.
        </p>
      )}

      {state === "ready" && items.length === 0 && (
        <p className="py-14 text-center text-sm text-charcoal/70">
          No pieces match that. Try clearing a filter.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {items.map((product) => (
          <a
            key={product.id}
            href={`/collections/piece/${product.slug}`}
            className="glass group overflow-hidden rounded-2xl transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-gold/55"
          >
            <div className="aspect-4/5 overflow-hidden bg-plum">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0] ?? fallbackImage}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            <div className="px-5 pb-5 pt-4">
              <h3 className="font-display text-[17px] leading-tight text-plum">{product.name}</h3>
              <span className="label mt-2 block text-wine">
                {METAL_LABELS[product.metal]} · {product.diamondCaratW} ct ·{" "}
                {product.diamondColour} {product.diamondClarity}
              </span>
              <span className="mt-3 block font-display text-[18px] text-charcoal">
                {format(product.priceMinor, product.currency)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
