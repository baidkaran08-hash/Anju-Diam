import { prisma } from "@/lib/prisma";
import { ok, fromZod } from "@/lib/api";
import { productQuerySchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

/** GET /api/products — search, filter, sort and paginate the catalogue. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = productQuerySchema.safeParse(params);
  if (!parsed.success) return fromZod(parsed.error);

  const { q, category, metal, illusionSet, minPrice, maxPrice, sort, page, perPage } = parsed.data;

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (category) where.category = category;
  if (metal) where.metal = metal;
  if (illusionSet) where.illusionSet = illusionSet === "true";
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceMinor = {
      ...(minPrice !== undefined ? { gte: minPrice * 100 } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice * 100 } : {}),
    };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    newest: { createdAt: "desc" as const },
    price_asc: { priceMinor: "asc" as const },
    price_desc: { priceMinor: "desc" as const },
    carat_desc: { diamondCaratW: "desc" as const },
  }[sort];

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return ok({
    items,
    page,
    perPage,
    total,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  });
}
