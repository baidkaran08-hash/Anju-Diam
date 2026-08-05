import type { Category } from "@prisma/client";

/** Category metadata shared by the nav, footer, and collection pages. */
export const CATEGORIES: { key: Category; slug: string; name: string; tag: string }[] = [
  { key: "RINGS", slug: "rings", name: "Rings", tag: "Solitaire · Illusion" },
  { key: "EARRINGS", slug: "earrings", name: "Earrings", tag: "Studs · Drops" },
  { key: "NECKLACES", slug: "necklaces", name: "Necklaces", tag: "Everyday · Occasion" },
  { key: "BRACELETS", slug: "bracelets", name: "Bracelets", tag: "Tennis · Line" },
  { key: "BRIDAL", slug: "bridal", name: "Bridal", tag: "Engagement · Eternity" },
];

export const bySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export const METAL_LABELS: Record<string, string> = {
  YELLOW_GOLD_18K: "18K yellow gold",
  WHITE_GOLD_18K: "18K white gold",
  ROSE_GOLD_18K: "18K rose gold",
};
