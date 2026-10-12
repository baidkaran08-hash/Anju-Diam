import { z } from "zod";

import {
  CATEGORIES,
  CERT_LABS,
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
  /// Omitted for a one-of-one piece; required by the route when the piece has
  /// variants, because "a ring" with no size is not something the atelier can
  /// actually quote.
  variantId: z.string().min(1).max(64).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  note: z.string().trim().max(400).optional().or(z.literal("")),
});

export const cartUpdateSchema = z.object({
  productId: z.string().min(1).max(64),
  variantId: z.string().min(1).max(64).optional().or(z.literal("")),
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
  // "" means the house never recorded it. The storefront hides the row rather
  // than printing a metal it was never told.
  metal: z.union([z.enum(METALS), z.literal("")]).default("YELLOW_GOLD_18K"),
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

  priceOnEnquiry: z.coerce.boolean().default(false),
  madeToOrder: z.coerce.boolean().default(true),
  soldOut: z.coerce.boolean().default(false),
  stock: z.coerce
    .number({ invalid_type_error: "Enter the number of units on hand." })
    .int("Whole units only.")
    .min(0)
    .max(100_000)
    .default(0),
  variantAxis: z.string().trim().max(40).optional().or(z.literal("")),
});

/**
 * The one-click switch on the catalogue list. Strict boolean on purpose: unlike
 * the form fields above, nothing legitimate sends this as a string, and
 * z.coerce.boolean() would read the string "false" as true.
 */
export const soldOutSchema = z.object({ soldOut: z.boolean() });

// ── Admin: variants and certificates ────────────────────────────────────────

export const productVariantSchema = z.object({
  label: text(1, 40, "The option label"),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  /**
   * Whole baht, like `price` above, and null when the option costs the same as
   * the piece. An empty string arrives from an untouched form field, so it has
   * to mean "no override" rather than "free".
   */
  price: z
    .union([z.coerce.number().min(0).max(1_000_000_000), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" || value === undefined || value === null ? null : value)),
  stock: z.coerce.number().int().min(0).max(100_000).default(0),
  position: z.coerce.number().int().min(0).max(200).default(0),
});

export const productVariantsSchema = z.object({
  variants: z
    .array(productVariantSchema)
    .max(60, "Sixty options is the limit for one piece.")
    .superRefine((variants, ctx) => {
      const seen = new Set<string>();
      variants.forEach((variant, index) => {
        const key = variant.label.trim().toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "label"],
            message: `"${variant.label}" is listed twice.`,
          });
        }
        seen.add(key);
      });
    }),
});

/** Accepts "2024-03-11" from a date input, and blank for "not recorded". */
const optionalDate = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: "That is not a date we can read.",
  });

export const certificateSchema = z.object({
  lab: z.enum(CERT_LABS).default("GIA"),
  number: text(1, 40, "The report number"),
  documentUrl: z.string().trim().max(500).optional().or(z.literal("")),
  caratW: z
    .union([z.coerce.number().min(0).max(1_000), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" || value === undefined || value === null ? null : value)),
  colour: z.string().trim().max(6).optional().or(z.literal("")),
  clarity: z.string().trim().max(8).optional().or(z.literal("")),
  cut: z.string().trim().max(24).optional().or(z.literal("")),
  issuedOn: optionalDate,
  position: z.coerce.number().int().min(0).max(50).default(0),
});

export const certificatesSchema = z.object({
  certificates: z.array(certificateSchema).max(24, "Twenty-four reports is the limit."),
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
