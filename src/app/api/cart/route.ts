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

  const result = await addToCart(key, input.productId, input.quantity, input.note || undefined, user?.id);
  if ("error" in result) return fail(result.error, 404);

  return ok(serialiseCart(result.cart));
});

export const PATCH = route(async (request: Request) => {
  const input = cartUpdateSchema.parse(await readJson(request));
  const key = await getOrCreateOwnerKey();
  return ok(serialiseCart(await setCartQuantity(key, input.productId, input.quantity)));
});

export const DELETE = route(async () => {
  const key = await getOrCreateOwnerKey();
  await clearCart(key);
  return ok(serialiseCart(await getCart(key)));
});
