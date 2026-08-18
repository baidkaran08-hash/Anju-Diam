"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProductArt } from "@/lib/product-art";
import { formatMoneyCompact } from "@/lib/money";
import { CATEGORIES, PRODUCT_STATUSES } from "@/lib/enums";
import type { GalleryImage } from "@/components/admin/ImageManager";

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  priceMinor: number;
  currency: string;
  diamondCaratW: number;
  metal: string;
  stoneShape: string;
  diamondCount: number;
  illusionSet: boolean;
  isFeatured: boolean;
  updatedAt: string;
  images: GalleryImage[];
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "text-[#3F7A55]",
  DRAFT: "text-gold",
  ARCHIVED: "text-graphite/40",
};

export default function ProductTable({
  rows,
  total,
  page,
  pages,
  statusCounts,
}: {
  rows: Row[];
  total: number;
  page: number;
  pages: number;
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const setParam = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    router.push(`/admin/products${next.size ? `?${next}` : ""}`);
  };

  return (
    <div>
      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setParam({ q: query || null });
            }}
            className="flex items-center gap-2"
          >
            <label className="sr-only" htmlFor="admin-search">
              Search the catalogue
            </label>
            <input
              id="admin-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or web address"
              className="field w-64 text-sm"
            />
            <button type="submit" className="label-sm text-plum underline underline-offset-4">
              Search
            </button>
          </form>

          <select
            value={params.get("status") ?? ""}
            onChange={(event) => setParam({ status: event.target.value || null })}
            aria-label="Filter by status"
            className="label-sm border border-graphite/20 bg-transparent px-3 py-2.5 text-plum"
          >
            <option value="">All statuses</option>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()} ({statusCounts[status] ?? 0})
              </option>
            ))}
          </select>

          <select
            value={params.get("category") ?? ""}
            onChange={(event) => setParam({ category: event.target.value || null })}
            aria-label="Filter by collection"
            className="label-sm border border-graphite/20 bg-transparent px-3 py-2.5 text-plum"
          >
            <option value="">All collections</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <Link href="/admin/products/new" className="btn-gold">
          Add a piece
        </Link>
      </div>

      <p className="label-sm mb-5 text-graphite/45">
        {total} {total === 1 ? "piece" : "pieces"}
      </p>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="border border-graphite/12 bg-ivory py-24 text-center">
          <p className="display-sm text-plum">Nothing matches that.</p>
          <Link href="/admin/products" className="label-sm mt-5 inline-block text-plum underline underline-offset-4">
            Clear the filters
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-graphite/10 border-y border-graphite/12 bg-ivory">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/products/${row.id}`}
                className="flex items-center gap-5 p-4 transition-colors hover:bg-stone/30"
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-plum">
                  {row.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ProductArt product={row} tone="plum" className="h-full w-full" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-base text-plum">{row.name}</span>
                    {row.isFeatured && <span className="label-sm text-gold">Featured</span>}
                    {row.illusionSet && <span className="label-sm text-wine">Illusion</span>}
                  </div>
                  <p className="label-sm mt-1.5 text-graphite/40">
                    {row.category.toLowerCase()} · {row.diamondCaratW.toFixed(2)} ct ·{" "}
                    {row.images.length > 0
                      ? `${row.images.length} photo${row.images.length === 1 ? "" : "s"}`
                      : "generated artwork"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums text-graphite">
                    {formatMoneyCompact(row.priceMinor, row.currency)}
                  </p>
                  <p className={`label-sm mt-1.5 ${STATUS_TONE[row.status] ?? ""}`}>
                    {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setParam({ page: String(page - 1) })}
            disabled={page <= 1}
            className="label-sm px-4 py-3 text-plum disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="label-sm text-graphite/50">
            {page} of {pages}
          </span>
          <button
            type="button"
            onClick={() => setParam({ page: String(page + 1) })}
            disabled={page >= pages}
            className="label-sm px-4 py-3 text-plum disabled:opacity-30"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
