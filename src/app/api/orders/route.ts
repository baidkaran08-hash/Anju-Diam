import { prisma } from "@/lib/prisma";
import { ok, fail, fromZod } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { orderSchema } from "@/lib/validation";

/** GET /api/orders — the signed-in customer's order history. */
export async function GET() {
  const session = await getSession();
  if (!session) return fail("Sign in to see your orders.", 401);

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: { items: { include: { product: { select: { name: true, slug: true, images: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return ok({ orders });
}

/**
 * POST /api/orders — turns the bag into an order.
 *
 * Payment is deliberately not wired here. The client has not chosen a gateway,
 * and an order in PENDING is the correct state to hand to one. Drop the
 * provider's session creation in after the transaction commits.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return fail("Sign in to place an order.", 401);

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return fail("Your bag is empty.", 409);

  const unavailable = cart.items.filter((item) => item.product.status !== "ACTIVE");
  if (unavailable.length > 0) {
    return fail("Some pieces in your bag are no longer available. Remove them to continue.", 409, {
      productIds: unavailable.map((item) => item.productId),
    });
  }

  const totalMinor = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.product.priceMinor,
    0,
  );

  // Human-facing reference, e.g. AD-2026-0412.
  // Count-based numbering can collide if two orders land in the same
  // millisecond. `reference` is unique in the schema so a collision fails
  // loudly rather than silently duplicating. At this volume that is the right
  // trade; move to a Postgres sequence if order rate ever makes it a problem.
  const year = new Date().getFullYear();
  const countThisYear = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const reference = `AD-${year}-${String(countThisYear + 1).padStart(4, "0")}`;

  // One transaction: create the order, snapshot prices, then empty the bag.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        userId: session.userId,
        totalMinor,
        currency: cart.items[0].product.currency,
        ...parsed.data,
        customerPhone: parsed.data.customerPhone || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceMinor: item.product.priceMinor,
            note: item.note,
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return ok({ order }, 201);
}
