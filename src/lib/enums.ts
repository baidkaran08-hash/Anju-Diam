/**
 * Domain unions.
 *
 * These would be Prisma enums on Postgres. Because the schema also has to run
 * on SQLite (see prisma/schema.prisma), they live here as const tuples and are
 * enforced at every write path by the Zod schemas in src/lib/validation.ts.
 * Keep the two in step.
 */

export const CATEGORIES = ["RINGS", "EARRINGS", "NECKLACES", "BRACELETS", "GIFTING"] as const;

/**
 * Categories no longer offered. The seed reassigns anything still sitting in
 * one of these so a retired collection can never resurface on the storefront.
 */
export const RETIRED_CATEGORIES = ["BRIDAL"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const METALS = ["YELLOW_GOLD_18K", "WHITE_GOLD_18K", "ROSE_GOLD_18K"] as const;
export type Metal = (typeof METALS)[number];

export const STONE_SHAPES = [
  "ROUND",
  "OVAL",
  "PEAR",
  "EMERALD",
  "MARQUISE",
  "PRINCESS",
  "CUSHION",
] as const;
export type StoneShape = (typeof STONE_SHAPES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ENQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_KINDS = ["CONTACT", "CUSTOM", "PRODUCT"] as const;
export type EnquiryKind = (typeof ENQUIRY_KINDS)[number];

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// ── Display helpers ─────────────────────────────────────────────────────────

export const metalLabel: Record<Metal, string> = {
  YELLOW_GOLD_18K: "18k Yellow Gold",
  WHITE_GOLD_18K: "18k White Gold",
  ROSE_GOLD_18K: "18k Rose Gold",
};

/** Short form for dense contexts — filter chips, spec rails. */
export const metalShortLabel: Record<Metal, string> = {
  YELLOW_GOLD_18K: "Yellow",
  WHITE_GOLD_18K: "White",
  ROSE_GOLD_18K: "Rose",
};

export const stoneShapeLabel: Record<StoneShape, string> = {
  ROUND: "Round Brilliant",
  OVAL: "Oval",
  PEAR: "Pear",
  EMERALD: "Emerald Cut",
  MARQUISE: "Marquise",
  PRINCESS: "Princess",
  CUSHION: "Cushion",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "In the atelier",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const enquiryKindLabel: Record<EnquiryKind, string> = {
  CONTACT: "General enquiry",
  CUSTOM: "Bespoke commission",
  PRODUCT: "Piece enquiry",
};

/** The metal tones, as hex, for the generated placeholder artwork. */
export const metalTone: Record<Metal, { light: string; mid: string; dark: string }> = {
  YELLOW_GOLD_18K: { light: "#EBD5A6", mid: "#C8A46A", dark: "#8C6E3C" },
  WHITE_GOLD_18K: { light: "#F2EFEA", mid: "#D9D2CC", dark: "#9C948D" },
  ROSE_GOLD_18K: { light: "#EFC9BC", mid: "#D2A08D", dark: "#9C6A58" },
};
