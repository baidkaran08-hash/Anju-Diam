import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Cart reads and writes, shared by the route handlers and the server
 * components that render /cart and the header count.
 *
 * Prices are always re-read from the product row rather than trusted from the
 * client, so a stale tab cannot check out at last week's price.
 */

const withProduct = {
  items: {
    include: { product: { include: { images: { orderBy: { position: "asc" as const } } } } },
    orderBy: { id: "asc" as const },
  },
} as const;

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

export async function getCart(key: string) {
  return prisma.cart.findUnique({ where: { key }, include: withProduct });
}

export async function getOrCreateCart(key: string, userId?: string) {
  const existing = await prisma.cart.findUnique({ where: { key }, include: withProduct });
  if (existing) return existing;
  await prisma.cart.create({ data: { key, userId } });
  return prisma.cart.findUniqueOrThrow({ where: { key }, include: withProduct });
}

/** Explicit union so `"error" in result` actually narrows at the call site. */
export type AddResult = { error: string } | { cart: CartWithItems | null };

export async function addToCart(
  key: string,
  productId: string,
  quantity: number,
  note?: string,
  userId?: string,
): Promise<AddResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!product) return { error: "That piece is no longer available." as const };

  const cart = await getOrCreateCart(key, userId);
  const existing = cart.items.find((item) => item.productId === productId);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(10, existing.quantity + quantity), note: note || existing.note },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, note: note || null },
    });
  }

  return { cart: await getCart(key) };
}

/** Quantity 0 removes the line. */
export async function setCartQuantity(key: string, productId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { key }, include: { items: true } });
  if (!cart) return null;

  const item = cart.items.find((row) => row.productId === productId);
  if (!item) return getCart(key);

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }

  return getCart(key);
}

export async function clearCart(key: string) {
  const cart = await prisma.cart.findUnique({ where: { key } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export function summarise(cart: { items: { quantity: number; product: { priceMinor: number } }[] } | null) {
  if (!cart) return { count: 0, subtotalMinor: 0 };
  return {
    count: cart.items.reduce((total, item) => total + item.quantity, 0),
    subtotalMinor: cart.items.reduce(
      (total, item) => total + item.quantity * item.product.priceMinor,
      0,
    ),
  };
}

/** Shape sent to the client — no internal ids beyond what the UI needs. */
export function serialiseCart(cart: CartWithItems | null) {
  const summary = summarise(cart);
  return {
    ...summary,
    currency: cart?.items[0]?.product.currency ?? "THB",
    items:
      cart?.items.map((item) => ({
        productId: item.productId,
        slug: item.product.slug,
        name: item.product.name,
        category: item.product.category,
        metal: item.product.metal,
        stoneShape: item.product.stoneShape,
        diamondCount: item.product.diamondCount,
        diamondCaratW: item.product.diamondCaratW,
        illusionSet: item.product.illusionSet,
        image: item.product.images[0]?.url ?? null,
        priceMinor: item.product.priceMinor,
        currency: item.product.currency,
        quantity: item.quantity,
        note: item.note,
      })) ?? [],
  };
}
