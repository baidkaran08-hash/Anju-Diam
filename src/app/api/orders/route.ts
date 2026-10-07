import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateOwnerKey } from "@/lib/owner";
import { clearCart, getCart } from "@/lib/cart";
import { availability, effectivePriceMinor, variantOrderable } from "@/lib/stock";
import { checkoutSchema } from "@/lib/validation";
import { fail, ok, readJson, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendOrderAcknowledgement, sendOrderAlert } from "@/lib/mailer";

/** AD-2026-4821 — year plus a random block, checked for collision. */
async function nextReference(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `AD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = await prisma.order.findUnique({ where: { reference: candidate } });
    if (!clash) return candidate;
  }
  return `AD-${Date.now()}`;
}

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return ok({ orders: [] });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true, slug: true } } } } },
  });

  return ok({ orders });
});

export const POST = route(async (request: Request) => {
  const limit = rateLimit(`order:${clientIp(request)}`, 8, 60 * 60 * 1000);
  if (!limit.ok) return fail("Too many submissions. Please try again shortly.", 429);

  const input = checkoutSchema.parse(await readJson(request));
  if (input.company) return ok({ ok: true }, { status: 201 });

  const key = await getOrCreateOwnerKey();
  const cart = await getCart(key);
  if (!cart || cart.items.length === 0) return fail("Your selection is empty.", 400);

  const user = await getSessionUser();

  // Last check before the order is written. A piece can sell while it sits in
  // someone's selection, and the cart was only validated when it went in.
  for (const item of cart.items) {
    if (item.variant) {
      if (!variantOrderable(item.product, item.variant)) {
        return fail(
          `${item.product.name} — ${item.variant.label} was taken while you were deciding. Remove it, or enquire and we will make another.`,
          409,
        );
      }
      if (!item.product.madeToOrder && item.quantity > item.variant.stock) {
        return fail(
          `Only ${item.variant.stock} of ${item.product.name} — ${item.variant.label} remain. Adjust the quantity to continue.`,
          409,
        );
      }
    } else if (!availability(item.product).orderable) {
      return fail(
        `${item.product.name} was taken while you were deciding. Remove it, or enquire and we will make another.`,
        409,
      );
    } else if (!item.product.madeToOrder && item.quantity > item.product.stock) {
      return fail(
        `Only ${item.product.stock} of ${item.product.name} remain. Adjust the quantity to continue.`,
        409,
      );
    }
  }

  // Prices come from the product rows, never from the client. The option's
  // override wins when it has one.
  const lines = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPriceMinor: effectivePriceMinor(item.product, item.variant),
    variantLabel: item.variant?.label ?? null,
    note: item.note,
    name: item.product.name,
  }));
  const totalMinor = lines.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0);

  // The order and the stock it consumes are written together — a crash between
  // the two would either sell a piece twice or lose one from the count.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference: await nextReference(),
        userId: user?.id,
        status: "PENDING",
        totalMinor,
        currency: cart.items[0]!.product.currency,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || null,
        shippingLine1: input.shippingLine1,
        shippingCity: input.shippingCity,
        shippingPost: input.shippingPost,
        shippingCountry: input.shippingCountry,
        message: input.message || null,
        items: {
          create: lines.map(({ name: _name, ...line }) => line),
        },
      },
    });

    // Made-to-order pieces are not counted, so nothing to draw down.
    for (const item of cart.items) {
      if (item.product.madeToOrder) continue;

      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    return created;
  });

  await clearCart(key);

  const payload = {
    reference: order.reference,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    totalMinor: order.totalMinor,
    currency: order.currency,
    items: lines,
    shipping: {
      line1: order.shippingLine1,
      city: order.shippingCity,
      post: order.shippingPost,
      country: order.shippingCountry,
    },
    message: order.message,
  };

  await Promise.all([sendOrderAlert(payload), sendOrderAcknowledgement(payload)]);

  return ok({ reference: order.reference }, { status: 201 });
});
