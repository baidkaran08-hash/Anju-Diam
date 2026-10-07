import { ok, fail, readJson, route } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateOwnerKey } from "@/lib/owner";
import { addToCart, clearCart, getCart, serialiseCart, setCartQuantity } from "@/lib/cart";
import { cartItemSchema, cartUpdateSchema } from "@/lib/validation";

export const GET = route(async () => {
  const key = await getOrCreateOwnerKey();
  return ok(serialiseCart(await getCart(key)));
});

export const POST = route(async (request: Request) => {
  const input = cartItemSchema.parse(await readJson(request));
  const key = await getOrCreateOwnerKey();
  const user = await getSessionUser();

  const result = await addToCart({
    key,
    productId: input.productId,
    variantId: input.variantId || undefined,
    quantity: input.quantity,
    note: input.note || undefined,
    userId: user?.id,
  });
  // 409, not 404: the piece exists, it just cannot be added as asked — a
  // missing size or a sold-out option. The form shows the message either way,
  // but the status should not claim the URL was wrong.
  if ("error" in result) return fail(result.error, 409);

  return ok(serialiseCart(result.cart));
});

export const PATCH = route(async (request: Request) => {
  const input = cartUpdateSchema.parse(await readJson(request));
  const key = await getOrCreateOwnerKey();
  return ok(
    serialiseCart(
      await setCartQuantity(key, input.productId, input.quantity, input.variantId || undefined),
    ),
  );
});

export const DELETE = route(async () => {
  const key = await getOrCreateOwnerKey();
  await clearCart(key);
  return ok(serialiseCart(await getCart(key)));
});
