"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ProductCard, { type CardProduct } from "@/components/ProductCard";
import { METALS, metalLabel, type Metal } from "@/lib/enums";
import { useCurrency } from "@/components/CurrencyProvider";

/**
 * Catalogue grid with search, filters, sort and paging.
 *
 * Filter state lives in the URL rather than in component state, so a filtered
 * view is shareable, survives a reload, and the back button behaves. Every
 * change replaces the history entry instead of pushing, so twenty filter
 * tweaks do not bury the page the visitor arrived from.
 */

type Props = {
  /** Locks the grid to one collection; the category filter is then hidden. */
  category?: string;
  bounds: { min: number; max: number };
  initial: { items: CardProduct[]; total: number; page: number; pages: number };
};

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "carat-desc", label: "Carat weight" },
  { value: "newest", label: "Newest" },
] as const;

export default function CatalogueBrowser({ category, bounds, initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // The price filter is posted to the API in baht, but a visitor browsing in
  // dollars must be able to type dollars — so the field converts both ways.
  const { format, amount, toTHB, currency } = useCurrency();

  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [queryDraft, setQueryDraft] = useState(params.get("q") ?? "");

  const gridRef = useRef<HTMLDivElement>(null);
  // The server already rendered page 1 for the current URL; skip the duplicate
  // fetch on mount and only go to the network once something actually changes.
  const firstRun = useRef(true);

  const search = params.toString();

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      // Any filter change invalidates the page number.
      if (!("page" in updates)) next.delete("page");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const request = new URLSearchParams(search);
    if (category) request.set("category", category);
    request.set("perPage", "24");

    fetch(`/api/products?${request}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload) setData(payload);
      })
      .catch(() => {
        /* aborted or offline — keep showing the last good grid */
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, category]);

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (queryDraft === current) return;
    const timer = setTimeout(() => setParam({ q: queryDraft || null }), 320);
    return () => clearTimeout(timer);
  }, [queryDraft, params, setParam]);

  const active = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const metal = params.get("metal");
    const illusion = params.get("illusion");
    const min = params.get("minPrice");
    const max = params.get("maxPrice");

    if (metal) list.push({ key: "metal", label: metalLabel[metal as Metal] ?? metal });
    if (illusion === "true") list.push({ key: "illusion", label: "Illusion set" });
    if (min) list.push({ key: "minPrice", label: `From ${format(Number(min) * 100)}` });
    if (max) list.push({ key: "maxPrice", label: `Up to ${format(Number(max) * 100)}` });
    return list;
  }, [params, format]);

  const goToPage = (page: number) => {
    setParam({ page: String(page) });
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* ── Control bar ─────────────────────────────────────────────────── */}
      <div className="glass-light glass-r sticky top-[84px] z-40 mb-12 px-6 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="label flex items-center gap-2.5 text-plum transition-colors hover:text-wine"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <path d="M2 5h16M5 10h10M8 15h4" strokeLinecap="round" />
              </svg>
              Filter
              {active.length > 0 && <span className="text-gold">({active.length})</span>}
            </button>

            <span className="label-sm text-graphite/45">
              {loading ? "…" : `${data.total} ${data.total === 1 ? "piece" : "pieces"}`}
            </span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-5">
            <label className="relative flex min-w-0 max-w-64 flex-1 items-center">
              <span className="sr-only">Search the collection</span>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-0 h-4 w-4 text-graphite/40" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" strokeLinecap="round" />
              </svg>
              <input
                value={queryDraft}
                onChange={(event) => setQueryDraft(event.target.value)}
                placeholder="Search"
                className="field pl-7 text-sm"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="sr-only">Sort by</span>
              <select
                value={params.get("sort") ?? "featured"}
                onChange={(event) => setParam({ sort: event.target.value })}
                className="label-sm cursor-pointer border-0 bg-transparent py-2 text-plum focus:outline-none"
              >
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* ── Filter drawer ─────────────────────────────────────────────── */}
        <div
          className={`grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            filtersOpen ? "grid-rows-[1fr] pt-8 opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid gap-8 pb-2 sm:grid-cols-2 lg:grid-cols-3">
              <fieldset>
                <legend className="label-sm mb-4 text-graphite/45">Metal</legend>
                <div className="flex flex-wrap gap-2">
                  {METALS.map((metal) => {
                    const on = params.get("metal") === metal;
                    return (
                      <button
                        key={metal}
                        type="button"
                        onClick={() => setParam({ metal: on ? null : metal })}
                        aria-pressed={on}
                        className={`label-sm border px-3.5 py-2.5 transition-colors duration-400 ${
                          on
                            ? "border-gold bg-gold text-ink"
                            : "border-graphite/20 text-graphite/70 hover:border-gold hover:text-plum"
                        }`}
                      >
                        {metalLabel[metal].replace("18k ", "")}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="label-sm mb-4 text-graphite/45">Setting</legend>
                <button
                  type="button"
                  onClick={() => setParam({ illusion: params.get("illusion") === "true" ? null : "true" })}
                  aria-pressed={params.get("illusion") === "true"}
                  className={`label-sm border px-3.5 py-2.5 transition-colors duration-400 ${
                    params.get("illusion") === "true"
                      ? "border-gold bg-gold text-ink"
                      : "border-graphite/20 text-graphite/70 hover:border-gold hover:text-plum"
                  }`}
                >
                  Illusion set
                </button>
              </fieldset>

              <fieldset>
                <legend className="label-sm mb-4 text-graphite/45">
                  Price · {format(bounds.min * 100)} – {format(bounds.max * 100)}
                  {currency !== "THB" && <span className="ml-1 opacity-70">({currency})</span>}
                </legend>
                <div className="flex items-center gap-3">
                  <input
                    key={`min-${currency}`}
                    type="number"
                    inputMode="numeric"
                    placeholder={String(amount(bounds.min * 100))}
                    defaultValue={
                      params.get("minPrice") ? String(amount(Number(params.get("minPrice")) * 100)) : ""
                    }
                    onBlur={(event) =>
                      setParam({
                        minPrice: event.target.value ? String(toTHB(Number(event.target.value))) : null,
                      })
                    }
                    className="field text-sm"
                    aria-label={`Minimum price in ${currency}`}
                  />
                  <span className="text-graphite/30">—</span>
                  <input
                    key={`max-${currency}`}
                    type="number"
                    inputMode="numeric"
                    placeholder={String(amount(bounds.max * 100))}
                    defaultValue={
                      params.get("maxPrice") ? String(amount(Number(params.get("maxPrice")) * 100)) : ""
                    }
                    onBlur={(event) =>
                      setParam({
                        maxPrice: event.target.value ? String(toTHB(Number(event.target.value))) : null,
                      })
                    }
                    className="field text-sm"
                    aria-label={`Maximum price in ${currency}`}
                  />
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active filters ──────────────────────────────────────────────── */}
      {active.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-3">
          {active.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setParam({ [chip.key]: null })}
              className="label-sm flex items-center gap-2 border border-gold/50 px-3 py-2 text-plum transition-colors hover:bg-gold hover:text-ink"
            >
              {chip.label}
              <span aria-hidden>×</span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setParam({ metal: null, illusion: null, minPrice: null, maxPrice: null, q: null })
            }
            className="label-sm text-graphite/45 underline underline-offset-4 hover:text-plum"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div ref={gridRef} className={`transition-opacity duration-500 ${loading ? "opacity-45" : "opacity-100"}`}>
        {data.items.length === 0 ? (
          <div className="py-28 text-center">
            <p className="display-md text-plum">Nothing matches that.</p>
            <p className="measure mx-auto mt-5 text-graphite/60">
              Try widening the price range, or write to us — a great deal of what we make never
              appears in a collection.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                tone={index % 3 === 1 ? "ivory" : "plum"}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Paging ──────────────────────────────────────────────────────── */}
      {data.pages > 1 && (
        <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(data.page - 1)}
            disabled={data.page <= 1}
            className="label-sm px-4 py-3 text-plum disabled:opacity-30"
          >
            ← Prev
          </button>

          {Array.from({ length: data.pages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === data.pages ||
                Math.abs(page - data.page) <= 1,
            )
            .map((page, index, list) => (
              <span key={page} className="flex items-center">
                {index > 0 && list[index - 1]! < page - 1 && (
                  <span className="px-2 text-graphite/30">…</span>
                )}
                <button
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={page === data.page ? "page" : undefined}
                  className={`label-sm h-10 w-10 transition-colors ${
                    page === data.page
                      ? "bg-plum text-ivory"
                      : "text-graphite/60 hover:text-plum"
                  }`}
                >
                  {page}
                </button>
              </span>
            ))}

          <button
            type="button"
            onClick={() => goToPage(data.page + 1)}
            disabled={data.page >= data.pages}
            className="label-sm px-4 py-3 text-plum disabled:opacity-30"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
