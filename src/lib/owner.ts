import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * Owner key for cart and wishlist rows.
 *
 * A visitor can build a selection before creating an account, so ownership is
 * an opaque string rather than a user id: "u:<userId>" when signed in,
 * "g:<guestId>" before that. The guest id is an httpOnly cookie, so it is not
 * readable by page scripts and survives a reload.
 */

const GUEST_COOKIE = "ad_guest";
const GUEST_MAX_AGE = 60 * 60 * 24 * 180;

export const userKey = (userId: string) => `u:${userId}`;
export const guestKey = (guestId: string) => `g:${guestId}`;

/**
 * Resolves the current owner key, minting a guest cookie if needed.
 *
 * Only callable from a Route Handler or Server Action — Next forbids writing
 * cookies while rendering. Use `readOwnerKey` from a Server Component.
 */
export async function getOrCreateOwnerKey(): Promise<string> {
  const user = await getSessionUser();
  if (user) return userKey(user.id);

  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return guestKey(existing);

  const guestId = randomUUID();
  store.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_MAX_AGE,
  });
  return guestKey(guestId);
}

/**
 * Read-only variant, safe during render. Returns null when the visitor has
 * neither an account nor a guest cookie yet — which simply means an empty
 * cart, not an error.
 */
export async function readOwnerKey(): Promise<string | null> {
  const user = await getSessionUser();
  if (user) return userKey(user.id);

  const store = await cookies();
  const guestId = store.get(GUEST_COOKIE)?.value;
  return guestId ? guestKey(guestId) : null;
}

/**
 * Folds a guest's cart and wishlist into their account at sign-in, so nothing
 * a visitor picked out before registering is lost.
 *
 * Quantities are summed on collision rather than overwritten — if someone put
 * two of a piece in as a guest and one as a member, three is the honest answer.
 */
export async function mergeGuestInto(userId: string) {
  const store = await cookies();
  const guestId = store.get(GUEST_COOKIE)?.value;
  if (!guestId) return;

  const from = guestKey(guestId);
  const to = userKey(userId);

  // ── Wishlist ──
  const guestWishes = await prisma.wishlistItem.findMany({ where: { key: from } });
  if (guestWishes.length > 0) {
    const existing = await prisma.wishlistItem.findMany({
      where: { key: to },
      select: { productId: true },
    });
    const have = new Set(existing.map((row) => row.productId));

    await prisma.$transaction([
      prisma.wishlistItem.createMany({
        data: guestWishes
          .filter((row) => !have.has(row.productId))
          .map((row) => ({ key: to, userId, productId: row.productId })),
      }),
      prisma.wishlistItem.deleteMany({ where: { key: from } }),
    ]);
  }

  // ── Cart ──
  const guestCart = await prisma.cart.findUnique({ where: { key: from }, include: { items: true } });
  if (guestCart && guestCart.items.length > 0) {
    const userCart = await prisma.cart.upsert({
      where: { key: to },
      create: { key: to, userId },
      update: { userId },
      include: { items: true },
    });

    for (const item of guestCart.items) {
      const match = userCart.items.find((row) => row.productId === item.productId);
      if (match) {
        await prisma.cartItem.update({
          where: { id: match.id },
          data: { quantity: Math.min(10, match.quantity + item.quantity), note: match.note ?? item.note },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            quantity: item.quantity,
            note: item.note,
          },
        });
      }
    }
  }

  if (guestCart) await prisma.cart.delete({ where: { id: guestCart.id } }).catch(() => {});
  store.delete(GUEST_COOKIE);
}
