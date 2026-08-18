/**
 * Single source of truth for brand-level constants.
 *
 * Anything the client will plausibly want to change without touching a
 * component — company details, navigation, the house diamond standard — lives
 * here rather than being scattered through JSX.
 */

export const site = {
  name: "Anju Diam",
  legalName: "Anju Diam Co., Ltd.",
  tagline: "Everyday Luxury. Timeless Brilliance.",
  description:
    "Fine natural diamond jewellery handcrafted in Bangkok since 1993. 18-karat gold, natural diamonds of G colour or higher and VS clarity or above — with a house speciality in illusion settings.",
  founded: 1993,
  founder: "Sanjay Kothari",
  city: "Bangkok",
  country: "Thailand",
  email: "info@anjudiam.com",
  /** Spaced for reading; `phoneHref` below is what the tel: link uses. */
  phoneDisplay: "+66 83 163 6736",
  phoneE164: "+66831636736",
  /**
   * Only what the client has confirmed. A street address has not been supplied
   * yet — inventing one to fill the card would be worse than showing less, so
   * the card says "by appointment" until the real address arrives.
   */
  addressLines: ["Anju Diam Co., Ltd.", "Bangkok, Thailand"],
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.anjudiam.com",
  domain: "www.anjudiam.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
  currency: "THB",
} as const;

/** Social channels shown on the contact card. Instagram is the only one the
 *  client runs; add here if that changes. */
export const social = [
  {
    key: "instagram",
    label: "Instagram",
    handle: "@anjudiam",
    href: "https://instagram.com/anjudiam",
  },
] as const;

/**
 * Opening hours.
 *
 * NOT YET CONFIRMED by the client — these are a sensible default for a Bangkok
 * atelier and should be checked before launch.
 */
export const openingHours = [
  { days: "Monday – Friday", hours: "10:00 – 18:00" },
  { days: "Saturday", hours: "10:00 – 16:00" },
  { days: "Sunday", hours: "By appointment" },
] as const;

/** The house standard, quoted verbatim from the brand write-up. */
export const houseStandard = {
  metal: "18-karat gold",
  /** Earth-mined, never laboratory-grown — the distinction the trade cares about. */
  origin: "natural diamonds",
  colour: "G colour or higher",
  clarity: "VS clarity or above",
} as const;

export type CategorySlug = "rings" | "earrings" | "necklaces" | "bracelets" | "gifting";

export type CategoryDefinition = {
  slug: CategorySlug;
  /** Matches the Prisma `Category` enum. */
  enumValue: "RINGS" | "EARRINGS" | "NECKLACES" | "BRACELETS" | "GIFTING";
  name: string;
  /** Used as the section eyebrow and in breadcrumbs. */
  shortName: string;
  blurb: string;
  /** Which frame of the 300-frame hero sequence heads this category. */
  frame: number;
};

export const categories: CategoryDefinition[] = [
  {
    slug: "rings",
    enumValue: "RINGS",
    name: "Rings",
    shortName: "Rings",
    blurb:
      "Solitaires, illusion-set clusters and stacking bands. Every shank is finished by hand so the piece sits flat and wears comfortably all day.",
    frame: 34,
  },
  {
    slug: "earrings",
    enumValue: "EARRINGS",
    name: "Earrings",
    shortName: "Earrings",
    blurb:
      "Studs that read larger than their carat weight, and drops engineered to swing true. Posts and backs are 18-karat throughout, never plated.",
    frame: 96,
  },
  {
    slug: "necklaces",
    enumValue: "NECKLACES",
    name: "Necklaces",
    shortName: "Necklaces",
    blurb:
      "Rivieres, pendants and tennis lines. Each link is articulated individually so the piece follows the collarbone instead of fighting it.",
    frame: 158,
  },
  {
    slug: "bracelets",
    enumValue: "BRACELETS",
    name: "Bracelets",
    shortName: "Bracelets",
    blurb:
      "Tennis bracelets and fine bangles with concealed box clasps and a double catch — the detail that separates jewellery from an accessory.",
    frame: 220,
  },
  {
    slug: "gifting",
    enumValue: "GIFTING",
    name: "Gifting",
    shortName: "Gifting",
    blurb:
      "Pieces chosen to be given. Pendants, lockets and fine bracelets that suit a birthday, an anniversary or a thank-you — boxed, carded and ready to hand over.",
    frame: 282,
  },
];

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
export const categoryByEnum = new Map(categories.map((c) => [c.enumValue, c]));

export const primaryNav = [
  { href: "/collections", label: "Collections" },
  { href: "/custom", label: "Custom Jewellery" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
  { href: "/enquire", label: "Enquire" },
] as const;

export const footerNav = [
  {
    heading: "Collections",
    links: categories.map((c) => ({ href: `/collections/${c.slug}`, label: c.name })),
  },
  {
    heading: "The House",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/about#craft", label: "Craftsmanship" },
      { href: "/about#standard", label: "The House Standard" },
      { href: "/custom", label: "Bespoke Commissions" },
    ],
  },
  {
    heading: "Client Care",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/enquire", label: "Make an Enquiry" },
      { href: "/account", label: "My Account" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/cart", label: "Selection" },
    ],
  },
] as const;

export function whatsappHref(message?: string) {
  if (!site.whatsapp) return null;
  const text = message ?? `Hello Anju Diam, I would like to enquire about a piece.`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
