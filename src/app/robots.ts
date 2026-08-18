import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
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
