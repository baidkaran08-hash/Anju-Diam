import "server-only";

import { prisma } from "@/lib/prisma";
import { availability, effectivePriceMinor, hasVariants, variantOrderable } from "@/lib/stock";

/**
 * Cart reads and writes, shared by the route handlers and the server
 * components that render /cart and the header count.
 *
 * Prices are always re-read from the product row rather than trusted from the
 * client, so a stale tab cannot check out at last week's price. The same goes
 * for availability: a line is re-checked against stock on every write, because
 * the piece may have sold while it sat in someone's selection.
 *
 * A line is identified by product AND option — two sizes of one ring are two
 * lines, not one line of quantity two, since the atelier makes them separately.
 */

const withProduct = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" as const } },
          variants: { orderBy: { position: "asc" as const } },
        },
      },
      variant: true,
    },
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

export type AddToCartInput = {
  key: string;
  productId: string;
  variantId?: string;
  quantity: number;
  note?: string;
  userId?: string;
};

export async function addToCart({
  key,
  productId,
  variantId,
  quantity,
  note,
  userId,
}: AddToCartInput): Promise<AddResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: "ACTIVE" },
    include: { variants: { orderBy: { position: "asc" } } },
  });
  if (!product) return { error: "That piece is no longer available." };

  // A selection is a list of figures that add up. A piece sold on enquiry has
  // no published figure, so it cannot sit in one — the storefront sends the
  // customer to the enquiry form instead, and this refuses the stale tab that
  // tries anyway.
  if (product.priceOnEnquiry) {
    return { error: "This piece is offered on enquiry. Write to us and we will answer with a price." };
  }

  // A piece with options cannot go in the cart without one — the atelier
  // cannot quote "a ring" with no size against it.
  let variant = null;
  if (hasVariants(product)) {
    if (!variantId) {
      return { error: `Choose a ${(product.variantAxis || "option").toLowerCase()} first.` };
    }
    variant = product.variants.find((row) => row.id === variantId) ?? null;
    if (!variant) return { error: "That option is no longer offered." };
    if (!variantOrderable(product, variant)) {
      return { error: `${variant.label} is spoken for. Enquire and we will make another.` };
    }
  } else if (variantId) {
    // Stale tab: the piece had options when the page was rendered and does not
    // now. Better to say so than to silently drop the choice.
    return { error: "That option is no longer offered." };
  }

  const state = availability(product);
  if (!state.orderable) {
    return { error: "That piece is spoken for. Enquire and we will make another." };
  }

  // What one line may hold: the hard cap of 10, further limited by real stock
  // when the piece is counted rather than made to order.
  const ceiling = product.madeToOrder
    ? 10
    : Math.min(10, variant ? variant.stock : Math.max(0, product.stock));

  const cart = await getOrCreateCart(key, userId);
  const existing = cart.items.find(
    (item) => item.productId === productId && item.variantId === (variant?.id ?? null),
  );

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: Math.min(ceiling, existing.quantity + quantity),
        note: note || existing.note,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variant?.id ?? null,
        quantity: Math.min(ceiling, quantity),
        note: note || null,
      },
    });
  }

  return { cart: await getCart(key) };
}

/** Quantity 0 removes the line. */
export async function setCartQuantity(
  key: string,
  productId: string,
  quantity: number,
  variantId?: string,
) {
  const cart = await prisma.cart.findUnique({ where: { key }, include: { items: true } });
  if (!cart) return null;

  const item = cart.items.find(
    (row) => row.productId === productId && row.variantId === (variantId || null),
  );
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

type SummariseLine = {
  quantity: number;
  product: { priceMinor: number };
  variant?: { priceMinor: number | null } | null;
};

export function summarise(cart: { items: SummariseLine[] } | null) {
  if (!cart) return { count: 0, subtotalMinor: 0 };
  return {
    count: cart.items.reduce((total, item) => total + item.quantity, 0),
    subtotalMinor: cart.items.reduce(
      (total, item) =>
        total + item.quantity * effectivePriceMinor(item.product, item.variant ?? null),
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
        variantId: item.variantId,
        variantLabel: item.variant?.label ?? null,
        variantAxis: item.product.variantAxis,
        slug: item.product.slug,
        name: item.product.name,
        category: item.product.category,
        metal: item.product.metal,
        stoneShape: item.product.stoneShape,
        diamondCount: item.product.diamondCount,
        diamondCaratW: item.product.diamondCaratW,
        illusionSet: item.product.illusionSet,
        image: item.product.images[0]?.url ?? null,
        priceMinor: effectivePriceMinor(item.product, item.variant),
        currency: item.product.currency,
        quantity: item.quantity,
        note: item.note,
      })) ?? [],
  };
}
