import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Called after every studio write so the public site reflects the change on the
 * very next page view rather than whenever a cache happens to expire.
 *
 * Invalidating the root layout invalidates every page beneath it — the home
 * page, collections, search, each product page and the sitemap. At this
 * catalogue size that is cheap, and it removes any need to remember which pages
 * a given edit touches.
 *
 * Never allowed to fail a save: the row is already written by the time this
 * runs, and a cache hiccup must not show the studio an error for a change that
 * did in fact go through.
 */
export function revalidateCatalogue() {
  try {
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[revalidate] could not refresh the storefront cache:", error);
  }
}
