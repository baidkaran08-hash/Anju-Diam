import "server-only";

import { prisma } from "@/lib/prisma";

const withProduct = {
  product: { include: { images: { orderBy: { position: "asc" as const } } } },
} as const;

export async function getWishlist(key: string) {
  return prisma.wishlistItem.findMany({
    where: { key },
    include: withProduct,
    orderBy: { createdAt: "desc" },
  });
}

export async function getWishlistIds(key: string | null) {
  if (!key) return [] as string[];
  const rows = await prisma.wishlistItem.findMany({ where: { key }, select: { productId: true } });
  return rows.map((row) => row.productId);
}

/** Adds or removes, returning the resulting state so the UI can toggle. */
export async function toggleWishlist(key: string, productId: string, userId?: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { key_productId: { key, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!product) return { saved: false, error: "That piece is no longer available." as const };

  await prisma.wishlistItem.create({ data: { key, productId, userId } });
  return { saved: true };
}
