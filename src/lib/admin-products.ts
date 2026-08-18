import "server-only";

import type { Prisma } from "@prisma/client";
import type { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { productWriteSchema } from "@/lib/validation";

/**
 * Studio-side product operations.
 *
 * Separate from src/lib/catalogue.ts on purpose: that module only ever returns
 * ACTIVE rows, because it backs the storefront. The studio has to see drafts
 * and archived pieces too, and mixing the two would make it far too easy to
 * leak an unpublished piece onto the shop.
 */

export type ProductWrite = z.infer<typeof productWriteSchema>;

const withImages = { images: { orderBy: { position: "asc" as const } } } as const;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** Appends -2, -3 … until the slug is free. Ignores the row being edited. */
export async function uniqueSlug(base: string, exceptId?: string) {
  const root = slugify(base) || "piece";
  let candidate = root;

  for (let n = 2; n < 500; n += 1) {
    const clash = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === exceptId) return candidate;
    candidate = `${root}-${n}`;
  }

  return `${root}-${Date.now()}`;
}

/** Maps the form's shape onto the row's shape. Baht in, satang out. */
function toRow(input: ProductWrite, slug: string) {
  return {
    slug,
    name: input.name,
    description: input.description,
    category: input.category,
    status: input.status,
    priceMinor: Math.round(input.price * 100),
    currency: input.currency.toUpperCase(),
    grossWeightG: input.grossWeightG,
    metal: input.metal,
    metalPurity: input.metalPurity,
    diamondCount: input.diamondCount,
    diamondCaratW: input.diamondCaratW,
    diamondColour: input.diamondColour.toUpperCase(),
    diamondClarity: input.diamondClarity.toUpperCase(),
    stoneShape: input.stoneShape,
    illusionSet: input.illusionSet,
    videoUrl: input.videoUrl || null,
    isFeatured: input.isFeatured,
    rank: input.rank,
  };
}

export async function createProduct(input: ProductWrite) {
  const slug = await uniqueSlug(input.slug || input.name);
  return prisma.product.create({ data: toRow(input, slug), include: withImages });
}

export async function updateProduct(id: string, input: ProductWrite) {
  const slug = await uniqueSlug(input.slug || input.name, id);
  return prisma.product.update({ where: { id }, data: toRow(input, slug), include: withImages });
}

export async function getProductForEdit(id: string) {
  return prisma.product.findUnique({ where: { id }, include: withImages });
}

export type AdminListQuery = {
  q?: string;
  category?: string;
  status?: string;
  page?: number;
  perPage?: number;
};

export async function listProductsForAdmin(query: AdminListQuery) {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(100, Math.max(1, query.perPage ?? 25));

  const where: Prisma.ProductWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.status) where.status = query.status;
  if (query.q) {
    const term = query.q.trim();
    where.OR = [{ name: { contains: term } }, { slug: { contains: term.toLowerCase() } }];
  }

  const [items, total, counts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: withImages,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["status"], _count: true }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    statusCounts: Object.fromEntries(counts.map((row) => [row.status, row._count])) as Record<
      string,
      number
    >,
  };
}

/**
 * Deleting a product that has already been ordered would orphan the order line,
 * so those are archived instead. The caller is told which happened.
 */
export async function deleteOrArchiveProduct(id: string) {
  const orderLines = await prisma.orderItem.count({ where: { productId: id } });

  if (orderLines > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    return { archived: true as const, reason: "It appears on a past order." };
  }

  await prisma.product.delete({ where: { id } });
  return { archived: false as const };
}

export async function replaceProductImages(
  productId: string,
  images: { url: string; alt: string; position: number }[],
) {
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    ...(images.length
      ? [
          prisma.productImage.createMany({
            data: images.map((image, index) => ({
              productId,
              url: image.url,
              alt: image.alt,
              position: image.position ?? index,
            })),
          }),
        ]
      : []),
  ]);

  return prisma.product.findUnique({ where: { id: productId }, include: withImages });
}

export async function studioSummary() {
  const [products, active, draft, archived, withPhotos, enquiriesNew, ordersPending, totalValue] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { status: "DRAFT" } }),
      prisma.product.count({ where: { status: "ARCHIVED" } }),
      prisma.product.count({ where: { images: { some: {} } } }),
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({ _sum: { totalMinor: true } }),
    ]);

  return {
    products,
    active,
    draft,
    archived,
    withPhotos,
    enquiriesNew,
    ordersPending,
    orderValueMinor: totalValue._sum.totalMinor ?? 0,
  };
}
