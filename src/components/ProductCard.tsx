"use client";

import Link from "next/link";

import ProductMedia, { type MediaProduct } from "@/components/ProductMedia";
import { useCart } from "@/components/CartProvider";
import { Price } from "@/components/CurrencyProvider";
import { metalShortLabel, stoneShapeLabel, type Metal, type StoneShape } from "@/lib/enums";
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

  return (
    <article className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-plum">
          <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]">
            <ProductMedia
              product={product}
              tone={tone}
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
            />
          </div>

          {product.illusionSet && (
            <span className="glass-chip label-sm absolute left-4 top-4 rounded-full px-3 py-1.5 text-gold">
              Illusion
            </span>
          )}

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
          <Price minor={product.priceMinor} className="shrink-0 text-sm font-light tabular-nums" />
        </div>

        <p className="label-sm mt-2.5 text-graphite/45">
          {product.diamondCaratW.toFixed(2)} ct ·{" "}
          {stoneShapeLabel[product.stoneShape as StoneShape] ?? product.stoneShape} ·{" "}
          {metalShortLabel[product.metal as Metal] ?? product.metal} gold
        </p>
      </div>

      <span className="sr-only">{index}</span>
    </article>
  );
}
