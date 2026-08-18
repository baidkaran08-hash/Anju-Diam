import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { categories, site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/collections`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/about`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/custom`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/enquire`, changeFrequency: "yearly", priority: 0.7 },
    ...categories.map((category) => ({
      url: `${site.url}/collections/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${site.url}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
