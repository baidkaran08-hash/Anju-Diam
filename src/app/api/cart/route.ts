import { prisma } from "@/lib/prisma";
import { ok, fail, fromZod } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { cartItemSchema } from "@/lib/validation";

async function cartFor(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { product: true } } },
  });
}

function total(items: { quantity: number; product: { priceMinor: number } }[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.product.priceMinor, 0);
}

/** GET /api/cart */
export async function GET() {
  const session = await getSession();
  if (!session) return fail("Sign in to see your bag.", 401);

  const cart = await cartFor(session.userId);
  return ok({ items: cart.items, totalMinor: total(cart.items) });
}

/** POST /api/cart — add a piece, or bump quantity if it is already in the bag. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return fail("Sign in to add pieces to your bag.", 401);

  const parsed = cartItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || product.status !== "ACTIVE") return fail("That piece is not available.", 404);

  const cart = await cartFor(session.userId);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    update: { quantity: { increment: parsed.data.quantity }, note: parsed.data.note },
    create: {
      cartId: cart.id,
      productId: product.id,
      quantity: parsed.data.quantity,
      note: parsed.data.note,
    },
  });

  const updated = await cartFor(session.userId);
  return ok({ items: updated.items, totalMinor: total(updated.items) }, 201);
}

/** PATCH /api/cart — set an exact quantity. Zero removes the line. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return fail("Sign in to change your bag.", 401);

  const { productId, quantity } = (await request.json().catch(() => ({}))) as {
    productId?: string;
    quantity?: number;
  };
  if (!productId || typeof quantity !== "number") {
    return fail("productId and quantity are required.");
  }

  const cart = await cartFor(session.userId);
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity: Math.min(quantity, 20) },
    });
  }

  const updated = await cartFor(session.userId);
  return ok({ items: updated.items, totalMinor: total(updated.items) });
}

/** DELETE /api/cart?productId=… — omit productId to empty the bag. */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return fail("Sign in to change your bag.", 401);

  const productId = new URL(request.url).searchParams.get("productId");
  const cart = await cartFor(session.userId);

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, ...(productId ? { productId } : {}) },
  });

  const updated = await cartFor(session.userId);
  return ok({ items: updated.items, totalMinor: total(updated.items) });
}
