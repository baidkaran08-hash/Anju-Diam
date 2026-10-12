import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { productQuerySchema } from "@/lib/validation";

export type ProductQuery = z.infer<typeof productQuerySchema>;

export type CatalogueProduct = Prisma.ProductGetPayload<{
  include: {
    images: { orderBy: { position: "asc" } };
    variants: { orderBy: { position: "asc" } };
  };
}>;

export type CatalogueProductDetail = Prisma.ProductGetPayload<{
  include: {
    images: { orderBy: { position: "asc" } };
    variants: { orderBy: { position: "asc" } };
    certificates: { orderBy: { position: "asc" } };
  };
}>;

/**
 * Grid shape. Options are included because a card has to say "from ฿X" and
 * whether anything is left, and both are answered from the variant rows — see
 * src/lib/stock.ts. Reports are not: nothing on a card shows them, and joining
 * them in would be pure weight on the collections page.
 */
const withImages = {
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: { position: "asc" } },
} as const;

/** Detail shape — everything the product page renders. */
const withDetail = {
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: { position: "asc" } },
  certificates: { orderBy: { position: "asc" } },
} as const;

function whereFor(query: Partial<ProductQuery>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (query.category) where.category = query.category;
  if (query.metal) where.metal = query.metal;
  if (query.illusion) where.illusionSet = query.illusion === "true";

  // A price filter can only speak about pieces that publish one. A
  // price-on-enquiry piece is excluded rather than swept in at its internal
  // figure, which the shopper was never shown and cannot have filtered on.
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceOnEnquiry = false;
    where.priceMinor = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice * 100 } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice * 100 } : {}),
    };
  }

  if (query.q) {
    // SQLite has no case-insensitive `mode` and no full-text index here, so
    // this is a plain substring match across the fields a shopper would search.
    // At 250 rows that is instant; past a few thousand, move to Postgres
    // tsvector or Meilisearch — the call site will not need to change.
    const term = query.q.trim();
    where.OR = [
      { name: { contains: term } },
      { description: { contains: term } },
      { slug: { contains: term.toLowerCase().replace(/\s+/g, "-") } },
    ];
  }

  return where;
}

/**
 * Sorting by price puts the pieces that publish one first, in order, and the
 * price-on-enquiry pieces after them — `false` sorts before `true`. Without
 * that leading clause they would all land at whatever their internal figure
 * happens to be, which is meaningless to the shopper doing the sorting.
 */
const ORDER_BY: Record<ProductQuery["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  // Sold pieces stay listed but sink to the end of the default order, so a
  // shopper meets what can actually be bought first.
  featured: [{ soldOut: "asc" }, { rank: "asc" }, { createdAt: "desc" }],
  "price-asc": [{ priceOnEnquiry: "asc" }, { priceMinor: "asc" }],
  "price-desc": [{ priceOnEnquiry: "asc" }, { priceMinor: "desc" }],
  newest: [{ createdAt: "desc" }],
  "carat-desc": [{ diamondCaratW: "desc" }],
};

export async function listProducts(input: Partial<ProductQuery>) {
  const query = productQuerySchema.parse(input);
  const where = whereFor(query);
  const skip = (query.page - 1) * query.perPage;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: ORDER_BY[query.sort],
      skip,
      take: query.perPage,
      include: withImages,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    perPage: query.perPage,
    pages: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: withDetail,
  });
}

/**
 * Same category, closest in price. Merchandising by price neighbourhood beats
 * merchandising by recency — someone looking at a ฿90,000 ring is not in the
 * market for a ฿1,100,000 riviere.
 */
export async function getRelated(product: { id: string; category: string; priceMinor: number }, take = 4) {
  const [above, below] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        soldOut: false,
        category: product.category,
        id: { not: product.id },
        priceMinor: { gte: product.priceMinor },
      },
      orderBy: { priceMinor: "asc" },
      take,
      include: withImages,
    }),
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        soldOut: false,
        category: product.category,
        id: { not: product.id },
        priceMinor: { lt: product.priceMinor },
      },
      orderBy: { priceMinor: "desc" },
      take,
      include: withImages,
    }),
  ]);

  return [...below.reverse(), ...above]
    .sort(
      (a, b) =>
        Math.abs(a.priceMinor - product.priceMinor) - Math.abs(b.priceMinor - product.priceMinor),
    )
    .slice(0, take);
}

export async function getFeatured() {
  return prisma.product.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    orderBy: [{ soldOut: "asc" }, { rank: "asc" }],
    include: withImages,
  });
}

/** Cheapest and dearest active piece, in whole baht — drives the price filter. */
export async function priceBounds(category?: string) {
  // Same reasoning as the filter: the slider's ends come only from pieces that
  // actually carry a published price.
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    priceOnEnquiry: false,
    ...(category ? { category } : {}),
  };
  const result = await prisma.product.aggregate({
    where,
    _min: { priceMinor: true },
    _max: { priceMinor: true },
  });
  return {
    min: Math.floor((result._min.priceMinor ?? 0) / 100),
    max: Math.ceil((result._max.priceMinor ?? 0) / 100),
  };
}

export async function categoryCounts() {
  const rows = await prisma.product.groupBy({
    by: ["category"],
    where: { status: "ACTIVE" },
    _count: true,
  });
  return Object.fromEntries(rows.map((row) => [row.category, row._count])) as Record<string, number>;
}
