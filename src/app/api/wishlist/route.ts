import { ok, readJson, route } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateOwnerKey } from "@/lib/owner";
import { getWishlist, getWishlistIds, toggleWishlist } from "@/lib/wishlist";
import { wishlistSchema } from "@/lib/validation";

export const GET = route(async () => {
  const key = await getOrCreateOwnerKey();
  const items = await getWishlist(key);
  return ok({
    ids: items.map((item) => item.productId),
    items: items.map((item) => ({
      productId: item.productId,
      slug: item.product.slug,
      name: item.product.name,
      priceMinor: item.product.priceMinor,
      currency: item.product.currency,
    })),
  });
});

export const POST = route(async (request: Request) => {
  const input = wishlistSchema.parse(await readJson(request));
  const key = await getOrCreateOwnerKey();
  const user = await getSessionUser();

  const result = await toggleWishlist(key, input.productId, user?.id);
  return ok({ ...result, ids: await getWishlistIds(key) });
});
