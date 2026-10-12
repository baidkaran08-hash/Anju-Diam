import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * SEARCH_INDEXING=off refuses every crawler outright, and is the correct state
 * for a staging or review deployment: the catalogue is real, the prices are
 * absent and the copy is not signed off, none of which should reach a search
 * result. Leave it unset on the production domain.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.SEARCH_INDEXING === "off") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here is secret, but none of it is worth indexing either, and
      // crawling the cart endlessly wastes budget on the pages that matter.
      disallow: ["/api/", "/admin", "/account", "/cart", "/checkout", "/wishlist"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
