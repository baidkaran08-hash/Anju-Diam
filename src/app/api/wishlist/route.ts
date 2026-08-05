import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { getSession } from "@/lib/auth";

async function requireSession() {
  const session = await getSession();
  return session ?? null;
}

/** GET /api/wishlist */
export async function GET() {
  const session = await requireSession();
  if (!session) return fail("Sign in to see your wishlist.", 401);

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return ok({ items });
}

/** POST /api/wishlist — idempotent, so double-tapping the heart is harmless. */
export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return fail("Sign in to save pieces.", 401);

  const { productId } = (await request.json().catch(() => ({}))) as { productId?: string };
  if (!productId) return fail("productId is required.");

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.userId, productId } },
    update: {},
    create: { userId: session.userId, productId },
  });
  return ok({ item }, 201);
}

/** DELETE /api/wishlist?productId=… */
export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) return fail("Sign in to change your wishlist.", 401);

  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return fail("productId is required.");

  await prisma.wishlistItem.deleteMany({ where: { userId: session.userId, productId } });
  return ok({ message: "Removed." });
}
