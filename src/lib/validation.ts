import { z } from "zod";

import {
  CATEGORIES,
  ENQUIRY_KINDS,
  ENQUIRY_STATUSES,
  METALS,
  ORDER_STATUSES,
  PRODUCT_STATUSES,
  STONE_SHAPES,
} from "@/lib/enums";

/**
 * Trimmed, length-capped string with messages a customer can act on.
 * Zod's defaults ("String must contain at least 2 character(s)") are not
 * something this brand should ever put in front of someone.
 */
const text = (min: number, max: number, label = "This") =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required.` : `${label} needs at least ${min} characters.`)
    .max(max, `${label} is longer than we can accept.`);

/**
 * Honeypot. Must stay permissive at the schema level — rejecting it here would
 * return a 422 naming the field, which tells a bot exactly what to omit next
 * time. The route reads it and answers 201 without writing anything.
 */
const honeypot = z.string().max(200).optional();

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("That does not look like a valid email address.")
  .max(200);

/** Deliberately permissive — international formats vary far too much to police. */
export const phoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(32)
  .regex(/^[+()\d\s.-]+$/, "Phone numbers may contain digits, spaces and + ( ) - . only.");

export const registerSchema = z.object({
  name: text(2, 80, "Your name"),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(200, "That password is unreasonably long."),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(200),
});

export const enquirySchema = z.object({
  name: text(2, 80, "Your name"),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  kind: z.enum(ENQUIRY_KINDS).default("CONTACT"),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: text(10, 4000, "Your message"),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  company: honeypot,
});

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  note: z.string().trim().max(400).optional().or(z.literal("")),
});

export const cartUpdateSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(0).max(10),
});

export const wishlistSchema = z.object({
  productId: z.string().min(1).max(64),
});

export const checkoutSchema = z.object({
  customerName: text(2, 80, "Your name"),
  customerEmail: emailSchema,
  customerPhone: phoneSchema.optional().or(z.literal("")),
  shippingLine1: text(4, 160, "The address"),
  shippingCity: text(2, 80, "The city"),
  shippingPost: text(3, 20, "The postcode"),
  shippingCountry: text(2, 80, "The country"),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  company: honeypot,
});

export const productQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  q: z.string().trim().max(120).optional(),
  metal: z.enum(METALS).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  illusion: z.enum(["true", "false"]).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest", "carat-desc"]).default("featured"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(60).default(24),
});

// ── Admin: products ─────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "The web address needs at least 2 characters.")
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens only — no spaces.",
  );

/**
 * Everything the studio can set on a piece.
 *
 * Price is taken in whole baht here, because that is what a person types.
 * The route converts it to satang before it touches the database — the UI
 * should never have to know that money is stored as an integer.
 */
export const productWriteSchema = z.object({
  slug: slugSchema.optional(),
  name: text(2, 160, "The name"),
  description: text(10, 5000, "The description"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Choose a collection." }) }),
  status: z.enum(PRODUCT_STATUSES).default("DRAFT"),

  price: z.coerce
    .number({ invalid_type_error: "Enter the price in whole baht." })
    .min(0, "Price cannot be negative.")
    .max(1_000_000_000),
  currency: z.string().trim().length(3).default("THB"),

  grossWeightG: z.coerce
    .number({ invalid_type_error: "Enter the gross weight in grams." })
    .min(0, "Weight cannot be negative.")
    .max(10_000),
  metal: z.enum(METALS).default("YELLOW_GOLD_18K"),
  metalPurity: z.string().trim().max(20).default("18K"),

  diamondCount: z.coerce
    .number({ invalid_type_error: "Enter the number of stones." })
    .int("Whole stones only.")
    .min(0)
    .max(10_000),
  diamondCaratW: z.coerce
    .number({ invalid_type_error: "Enter the total carat weight." })
    .min(0)
    .max(1_000),
  diamondColour: z.string().trim().min(1).max(6).default("G"),
  diamondClarity: z.string().trim().min(1).max(8).default("VS"),
  stoneShape: z.enum(STONE_SHAPES).default("ROUND"),
  illusionSet: z.coerce.boolean().default(false),

  videoUrl: z.string().trim().url("That is not a valid URL.").max(500).optional().or(z.literal("")),
  isFeatured: z.coerce.boolean().default(false),
  rank: z.coerce.number().int().min(0).max(100_000).default(500),
});

export const productImageSchema = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(200).default(""),
  position: z.coerce.number().int().min(0).max(50).default(0),
});

export const productImageOrderSchema = z.object({
  images: z.array(productImageSchema).max(12),
});

export const enquiryStatusSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(ENQUIRY_STATUSES),
});

export const orderStatusSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(ORDER_STATUSES),
});

/**
 * Collapses a ZodError into `{ field: message }`, which is what every form in
 * the app expects back from a 422.
 */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
