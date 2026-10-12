/**
 * Availability rules.
 *
 * Deliberately pure and free of any Prisma or server-only import, because the
 * same answer has to be reachable from a server component rendering the
 * product page and from the client component that owns the size selector. Two
 * implementations of "can this be ordered" would drift within a week.
 *
 * The rules, in the order they are applied:
 *
 *   0. The studio's sold-out switch overrides everything: the piece stays
 *      visible but cannot be ordered.
 *   1. A made-to-order piece is always orderable. This is the house default
 *      and covers most of the catalogue — the atelier cuts to commission, so
 *      counting units would be meaningless.
 *   2. Otherwise, if the piece has variants, availability is the variants'.
 *      The product-level `stock` column is ignored entirely in that case, so
 *      it can never disagree with the sum of its options.
 *   3. Otherwise the product-level count decides.
 */

/** Below this, the storefront says how many are left rather than "in stock". */
export const LOW_STOCK_AT = 3;

export type VariantLike = {
  id: string;
  label: string;
  sku?: string | null;
  priceMinor?: number | null;
  stock: number;
  position?: number;
};

export type StockLike = {
  madeToOrder: boolean;
  /** Set by the studio's sold-out switch; overrides every other rule. */
  soldOut?: boolean;
  stock: number;
  priceMinor: number;
  variants?: VariantLike[] | null;
};

export type Availability = {
  orderable: boolean;
  madeToOrder: boolean;
  /** Units on hand, or null when the piece is made to order and not counted. */
  units: number | null;
  low: boolean;
  /** True only when the studio has marked the piece sold out. */
  soldOut: boolean;
  label: string;
};

export function hasVariants(product: StockLike): boolean {
  return Boolean(product.variants && product.variants.length > 0);
}

export function availability(product: StockLike): Availability {
  // The studio's sold-out switch beats every rule below. A sold piece stays on
  // the storefront so its page, photographs and search ranking are not thrown
  // away, but nothing about it can be bought — counted or made to order alike.
  if (product.soldOut) {
    return {
      orderable: false,
      madeToOrder: product.madeToOrder,
      units: product.madeToOrder ? null : 0,
      low: false,
      soldOut: true,
      label: "Sold out",
    };
  }

  if (product.madeToOrder) {
    return {
      orderable: true,
      madeToOrder: true,
      units: null,
      low: false,
      soldOut: false,
      label: "Made to order",
    };
  }

  const units = hasVariants(product)
    ? product.variants!.reduce((total, variant) => total + Math.max(0, variant.stock), 0)
    : Math.max(0, product.stock);

  if (units <= 0) {
    return {
      orderable: false,
      madeToOrder: false,
      units: 0,
      low: false,
      soldOut: false,
      // Counted stock running out is "spoken for", not "sold out": the house
      // will happily commission another. An explicit Sold out is the studio's
      // own call, made with the switch above.
      label: "Enquire for availability",
    };
  }

  const low = units <= LOW_STOCK_AT;
  return {
    orderable: true,
    madeToOrder: false,
    units,
    low,
    soldOut: false,
    label: low ? (units === 1 ? "One remaining" : `Only ${units} remaining`) : "In stock",
  };
}

/** Whether one specific option can go in the cart right now. */
export function variantOrderable(product: StockLike, variant: VariantLike): boolean {
  if (product.soldOut) return false;
  if (product.madeToOrder) return true;
  return variant.stock > 0;
}

/**
 * The price actually charged for a piece, honouring a variant override.
 *
 * Takes only the price field off the variant rather than a whole VariantLike,
 * so a cart line — which selects a narrower shape from the database than the
 * storefront does — can call this without inventing the fields it never read.
 */
export function effectivePriceMinor(
  product: Pick<StockLike, "priceMinor">,
  variant?: { priceMinor?: number | null } | null,
): number {
  if (variant && variant.priceMinor != null) return variant.priceMinor;
  return product.priceMinor;
}

/**
 * Span of prices across a piece's options, for the "from ฿X" line on a grid
 * card. Returns equal bounds when nothing overrides the product price.
 */
export function priceRangeMinor(product: StockLike): { min: number; max: number } {
  if (!hasVariants(product)) return { min: product.priceMinor, max: product.priceMinor };

  const prices = product.variants!.map((variant) => effectivePriceMinor(product, variant));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
