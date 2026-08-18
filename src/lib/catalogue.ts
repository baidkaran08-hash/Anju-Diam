import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { productQuerySchema } from "@/lib/validation";

export type ProductQuery = z.infer<typeof productQuerySchema>;

export type CatalogueProduct = Prisma.ProductGetPayload<{
  include: { images: { orderBy: { position: "asc" } } };
}>;

const withImages = { images: { orderBy: { position: "asc" } } } as const;

function whereFor(query: Partial<ProductQuery>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (query.category) where.category = query.category;
  if (query.metal) where.metal = query.metal;
  if (query.illusion) where.illusionSet = query.illusion === "true";

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
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

const ORDER_BY: Record<ProductQuery["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ rank: "asc" }, { createdAt: "desc" }],
  "price-asc": [{ priceMinor: "asc" }],
  "price-desc": [{ priceMinor: "desc" }],
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
    include: withImages,
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
    orderBy: { rank: "asc" },
    include: withImages,
  });
}

/** Cheapest and dearest active piece, in whole baht — drives the price filter. */
export async function priceBounds(category?: string) {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE", ...(category ? { category } : {}) };
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
