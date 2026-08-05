import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Add your name so we know who to reply to.").max(120),
  email: z.string().trim().email("That email address does not look right."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
  note: z.string().trim().max(500).optional(),
});

export const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  shippingLine1: z.string().trim().min(4).max(200),
  shippingCity: z.string().trim().min(2).max(100),
  shippingPost: z.string().trim().min(2).max(20),
  shippingCountry: z.string().trim().min(2).max(80),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.enum(["RINGS", "EARRINGS", "NECKLACES", "BRACELETS", "BRIDAL"]).optional(),
  metal: z.enum(["YELLOW_GOLD_18K", "WHITE_GOLD_18K", "ROSE_GOLD_18K"]).optional(),
  illusionSet: z.enum(["true", "false"]).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "carat_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(24),
});
