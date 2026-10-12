"use client";

import Link from "next/link";

import ProductMedia, { type MediaProduct } from "@/components/ProductMedia";
import { useCart } from "@/components/CartProvider";
import { Price } from "@/components/CurrencyProvider";
import { metalShortLabel, stoneShapeLabel, type Metal, type StoneShape } from "@/lib/enums";
import { availability, priceRangeMinor, type VariantLike } from "@/lib/stock";
import type { ArtTone } from "@/lib/product-art";

export type CardProduct = MediaProduct & {
  id: string;
  slug: string;
  name: string;
  priceMinor: number;
  currency: string;
  diamondCaratW: number;
  metal: string;
  stoneShape: string;
  illusionSet: boolean;
  /**
   * Optional so the wishlist and any other caller that selects a narrower row
   * still type-checks. Absent behaves exactly as before: one price, always
   * orderable.
   */
  priceOnEnquiry?: boolean;
  madeToOrder?: boolean;
  /** The studio's sold-out switch. Absent means not sold. */
  soldOut?: boolean;
  stock?: number;
  variants?: VariantLike[];
};

export default function ProductCard({
  product,
  tone = "plum",
  index = 0,
  priority = false,
}: {
  product: CardProduct;
  tone?: ArtTone;
  index?: number;
  priority?: boolean;
}) {
  const { wishlist, toggleWishlist } = useCart();
  const saved = wishlist.includes(product.id);

  const stockable = {
    madeToOrder: product.madeToOrder ?? true,
    soldOut: product.soldOut ?? false,
    stock: product.stock ?? 0,
    priceMinor: product.priceMinor,
    variants: product.variants ?? [],
  };
  const state = availability(stockable);
  const range = priceRangeMinor(stockable);

  return (
    <article className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-plum">
          <div
            className={`absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045] ${
              state.soldOut ? "opacity-70" : ""
            }`}
          >
            <ProductMedia
              product={product}
              tone={tone}
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
            />
          </div>

          {/* Stacked top-left. The sold chip used to sit top-right, directly
              under the wishlist heart, so the two overlapped. */}
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {!state.orderable && (
              <span className="glass-chip label-sm rounded-full px-3 py-1.5 text-ivory">
                {state.soldOut ? "Sold out" : "Spoken for"}
              </span>
            )}

            {product.illusionSet && (
              <span className="glass-chip label-sm rounded-full px-3 py-1.5 text-gold">
                Illusion
              </span>
            )}
          </div>

          {/* Quick view affordance, desktop only. */}
          <span className="glass-chip glass-r-sm label-sm pointer-events-none absolute inset-x-4 bottom-4 hidden translate-y-3 py-3 text-center text-ivory opacity-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 md:block">
            View the piece
          </span>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => void toggleWishlist(product.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from saved pieces` : `Save ${product.name}`}
        className={`glass-chip absolute right-3 top-3 grid h-9 w-9 place-content-center rounded-full transition-colors duration-500 hover:text-gold ${
          saved ? "text-gold" : "text-ivory"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[17px] w-[17px]"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.3}
        >
          <path
            d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="display-sm leading-tight">
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-wine">
              {product.name}
            </Link>
          </h3>
          {product.priceOnEnquiry ? (
            <span className="shrink-0 whitespace-nowrap text-sm font-light text-graphite/50">
              On enquiry
            </span>
          ) : (
            <span className="shrink-0 whitespace-nowrap text-sm font-light tabular-nums">
              {range.min !== range.max && <span className="text-graphite/40">from </span>}
              <Price minor={range.min} />
            </span>
          )}
        </div>

        {/* Built from whatever the piece actually knows — a stock-sheet import
            often has carat and metal but no recorded cut, and an empty segment
            would leave a stranded separator on the card. */}
        <p className="label-sm mt-2.5 text-graphite/45">
          {[
            product.diamondCaratW > 0 ? `${product.diamondCaratW.toFixed(2)} ct` : "",
            product.stoneShape
              ? stoneShapeLabel[product.stoneShape as StoneShape] ?? product.stoneShape
              : "",
            product.metal ? `${metalShortLabel[product.metal as Metal] ?? product.metal} gold` : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span className="sr-only">{index}</span>
    </article>
  );
}
