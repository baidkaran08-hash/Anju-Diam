/**
 * Placeholder catalogue generator.
 *
 * The client's real product file is not available yet, so this synthesises 250
 * pieces that are internally consistent: carat weight drives price, price
 * drives which metals are offered, and every stone respects the house standard
 * of natural stones at G colour or higher and VS clarity or above.
 *
 * It is deterministic — same seed, same catalogue — so the demo does not
 * reshuffle every time the database is reset, and screenshots stay valid.
 *
 * When the real catalogue arrives it replaces this wholesale via
 * `npm run catalogue:import`. Nothing downstream reads from this file.
 */

import type { Category, Metal, StoneShape } from "../src/lib/enums";

// ── Deterministic RNG ───────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const round = (value: number, dp = 2) => Number(value.toFixed(dp));

// ── Naming ──────────────────────────────────────────────────────────────────

// House lines. Deliberately short and pronounceable in both Thai and English
// markets, which is the audience the PRD names.
const LINES = [
  "Aurelia", "Vesper", "Lumen", "Celeste", "Meridian", "Reverie", "Sonnet", "Halo",
  "Cascade", "Iris", "Juno", "Lyra", "Mira", "Nova", "Rhea", "Thalia", "Vela",
  "Zenith", "Solace", "Astra", "Ember", "Fable", "Grace", "Haven", "Isla",
  "Amara", "Elara", "Marisol", "Ondine", "Seraph", "Verity", "Wren", "Anouk",
  "Calla", "Dorée", "Étoile", "Fleur", "Giselle", "Liora", "Noor", "Priya",
  "Saphira", "Talise", "Ummi", "Vionne", "Yara", "Zaira", "Alise", "Bijou", "Clair",
] as const;

const FORMS: Record<Category, readonly { form: string; shapes: readonly StoneShape[]; illusionBias: number }[]> = {
  RINGS: [
    { form: "Solitaire Ring", shapes: ["ROUND", "OVAL", "PEAR", "CUSHION", "PRINCESS"], illusionBias: 0.1 },
    { form: "Illusion Cluster Ring", shapes: ["ROUND", "PRINCESS", "MARQUISE"], illusionBias: 0.95 },
    { form: "Eternity Band", shapes: ["ROUND", "PRINCESS", "EMERALD"], illusionBias: 0.2 },
    { form: "Half Eternity Band", shapes: ["ROUND", "PRINCESS"], illusionBias: 0.2 },
    { form: "Three Stone Ring", shapes: ["ROUND", "OVAL", "EMERALD", "PEAR"], illusionBias: 0.15 },
    { form: "Cocktail Ring", shapes: ["CUSHION", "OVAL", "MARQUISE"], illusionBias: 0.5 },
    { form: "Stacking Band", shapes: ["ROUND"], illusionBias: 0.1 },
  ],
  EARRINGS: [
    { form: "Solitaire Studs", shapes: ["ROUND", "PRINCESS", "CUSHION"], illusionBias: 0.15 },
    { form: "Illusion Studs", shapes: ["ROUND", "MARQUISE", "PEAR"], illusionBias: 0.95 },
    { form: "Halo Studs", shapes: ["ROUND", "OVAL", "CUSHION"], illusionBias: 0.25 },
    { form: "Drop Earrings", shapes: ["PEAR", "OVAL", "MARQUISE"], illusionBias: 0.45 },
    { form: "Hoop Earrings", shapes: ["ROUND", "PRINCESS"], illusionBias: 0.3 },
    { form: "Climber Earrings", shapes: ["ROUND", "MARQUISE"], illusionBias: 0.4 },
  ],
  NECKLACES: [
    { form: "Solitaire Pendant", shapes: ["ROUND", "PEAR", "OVAL", "EMERALD"], illusionBias: 0.1 },
    { form: "Illusion Pendant", shapes: ["ROUND", "MARQUISE", "PEAR"], illusionBias: 0.95 },
    { form: "Riviere Necklace", shapes: ["ROUND", "OVAL"], illusionBias: 0.2 },
    { form: "Tennis Necklace", shapes: ["ROUND", "PRINCESS"], illusionBias: 0.15 },
    { form: "Halo Pendant", shapes: ["ROUND", "CUSHION", "OVAL"], illusionBias: 0.3 },
    { form: "Station Necklace", shapes: ["ROUND", "MARQUISE"], illusionBias: 0.5 },
  ],
  BRACELETS: [
    { form: "Tennis Bracelet", shapes: ["ROUND", "PRINCESS", "EMERALD"], illusionBias: 0.15 },
    { form: "Illusion Line Bracelet", shapes: ["ROUND", "MARQUISE"], illusionBias: 0.95 },
    { form: "Bangle", shapes: ["ROUND", "OVAL"], illusionBias: 0.3 },
    { form: "Cuff Bracelet", shapes: ["ROUND", "PRINCESS"], illusionBias: 0.35 },
    { form: "Charm Bracelet", shapes: ["ROUND", "PEAR"], illusionBias: 0.4 },
  ],
  GIFTING: [
    { form: "Solitaire Pendant", shapes: ["ROUND", "PEAR", "OVAL"], illusionBias: 0.15 },
    { form: "Illusion Pendant", shapes: ["ROUND", "MARQUISE", "PEAR"], illusionBias: 0.95 },
    { form: "Locket Pendant", shapes: ["ROUND", "OVAL", "CUSHION"], illusionBias: 0.2 },
    { form: "Charm Bracelet", shapes: ["ROUND", "PEAR"], illusionBias: 0.35 },
    { form: "Everyday Studs", shapes: ["ROUND", "PRINCESS"], illusionBias: 0.3 },
    { form: "Stacking Band", shapes: ["ROUND"], illusionBias: 0.2 },
  ],
};

/** Total carat weight ranges, by category and form weight. */
const CARAT_RANGE: Record<Category, [number, number]> = {
  RINGS: [0.24, 2.4],
  EARRINGS: [0.3, 2.2],
  NECKLACES: [0.35, 6.5],
  BRACELETS: [1.2, 7.5],
  GIFTING: [0.18, 1.6],
};

/** Gross metal weight in grams, by category. */
const WEIGHT_RANGE: Record<Category, [number, number]> = {
  RINGS: [2.4, 7.8],
  EARRINGS: [1.6, 6.4],
  NECKLACES: [3.2, 16.5],
  BRACELETS: [6.5, 22.0],
  GIFTING: [1.8, 7.2],
};

const COLOURS = ["D", "E", "F", "G"] as const;
const CLARITIES = ["IF", "VVS1", "VVS2", "VS1", "VS2"] as const;
const METALS: readonly Metal[] = ["YELLOW_GOLD_18K", "WHITE_GOLD_18K", "ROSE_GOLD_18K"];

// ── Copy ────────────────────────────────────────────────────────────────────

const OPENERS = [
  "Built around",
  "Centred on",
  "Composed around",
  "Anchored by",
  "Designed around",
] as const;

const CRAFT_NOTES = [
  "The gallery is pierced by hand so light reaches the pavilion from beneath, which is what keeps the stone lively in low light.",
  "Every claw is cut and finished individually, then set below the girdle so nothing catches on fabric.",
  "The under-bezel is polished to a mirror before setting — a detail no one sees, and the reason the piece holds its brilliance.",
  "Each link is articulated on its own pivot, so the piece follows the body rather than sitting rigid against it.",
  "The setting is milled from a single billet rather than assembled, which keeps the profile low and the line unbroken.",
  "Stones are matched for colour across the whole piece before any of them are set, so the line reads as one continuous run.",
  "The shank is squared on the inside edge to stop the piece rotating on the finger through the day.",
  "A concealed box clasp with a double catch closes flush with the line, invisible once worn.",
] as const;

const ILLUSION_NOTES = [
  "The illusion plate is cut and mirror-finished by hand so the setting reads as one continuous stone rather than a cluster — the technique the house has specialised in since 1993.",
  "Set in the house illusion style: a faceted white-gold plate extends the visual spread of the natural diamonds well beyond their carat weight.",
  "An illusion setting carries the spread of a far larger solitaire, at a fraction of the stone cost — this is the work Anju Diam is known for.",
] as const;

const CLOSERS = [
  "Made to order in the Bangkok atelier and finished to your sizing.",
  "Available in yellow, white and rose gold, and adjustable to your specification.",
  "Supplied with a house certificate detailing the origin and grade of every stone in the piece.",
  "Quietly scaled for daily wear rather than the vitrine.",
  "Cut to a proportion that flatters both a slim and a broader hand.",
] as const;

// ── Pricing ─────────────────────────────────────────────────────────────────

/**
 * Baht, before rounding. Diamond price per carat is strongly non-linear — a
 * 2ct stone costs far more than two 1ct stones — so the stone component runs
 * on an exponent. Illusion pieces are cheaper for a given visual spread, which
 * is the entire commercial argument for the technique.
 */
function priceBaht(caratW: number, grams: number, illusion: boolean, colour: string, clarity: string) {
  // Calibrated to the brand's own positioning — "affordable luxury",
  // "price-competitive" — not to a Place Vendôme window. A 1ct G/VS solitaire
  // lands near ฿120,000, which is where this house actually competes.
  const stone = 78_000 * Math.pow(caratW, 1.35);
  const metal = grams * 3_150;
  const labour = 7_500 + grams * 750;

  const colourFactor = { D: 1.22, E: 1.14, F: 1.07, G: 1 }[colour] ?? 1;
  const clarityFactor = { IF: 1.3, VVS1: 1.2, VVS2: 1.12, VS1: 1.05, VS2: 1 }[clarity] ?? 1;
  const illusionFactor = illusion ? 0.62 : 1;

  const total = (stone * colourFactor * clarityFactor * illusionFactor + metal + labour) * 1.18;

  // Round to a presentable figure — nobody prices a luxury piece at ฿147,283.
  const step = total > 400_000 ? 5_000 : total > 100_000 ? 1_000 : 500;
  return Math.round(total / step) * step;
}

// ── Generator ───────────────────────────────────────────────────────────────

export type GeneratedProduct = {
  slug: string;
  name: string;
  description: string;
  category: Category;
  status: "ACTIVE";
  priceMinor: number;
  currency: string;
  grossWeightG: number;
  metal: Metal;
  metalPurity: string;
  diamondCount: number;
  diamondCaratW: number;
  diamondColour: string;
  diamondClarity: string;
  stoneShape: StoneShape;
  illusionSet: boolean;
  isFeatured: boolean;
  rank: number;
};

const DISTRIBUTION: [Category, number][] = [
  ["RINGS", 70],
  ["EARRINGS", 55],
  ["NECKLACES", 50],
  ["BRACELETS", 40],
  ["GIFTING", 35],
];

export function generateCatalogue(seed = 1993): GeneratedProduct[] {
  const rng = mulberry32(seed);
  const products: GeneratedProduct[] = [];
  const usedSlugs = new Set<string>();

  for (const [category, count] of DISTRIBUTION) {
    for (let i = 0; i < count; i += 1) {
      const forms = FORMS[category];
      const formDef = pick(rng, forms);
      const line = pick(rng, LINES);
      const shape = pick(rng, formDef.shapes);
      const metal = pick(rng, METALS);
      const illusionSet = rng() < formDef.illusionBias;

      const [caratMin, caratMax] = CARAT_RANGE[category];
      // Skew toward the lower half — a real catalogue is mostly accessible
      // pieces with a few statement ones, not a flat spread.
      const caratW = round(caratMin + Math.pow(rng(), 1.9) * (caratMax - caratMin), 2);

      const [gramMin, gramMax] = WEIGHT_RANGE[category];
      const grossWeightG = round(between(rng, gramMin, gramMax), 2);

      // Illusion and multi-stone forms carry many small stones; solitaires few.
      const multiStone =
        illusionSet ||
        /Eternity|Tennis|Riviere|Cluster|Station|Halo|Bangle|Cuff|Charm|Line/.test(formDef.form);
      const diamondCount = multiStone
        ? Math.max(7, Math.round(caratW * between(rng, 14, 46)))
        : Math.round(between(rng, 1, 3.99));

      const diamondColour = pick(rng, COLOURS);
      const diamondClarity = pick(rng, CLARITIES);

      const baht = priceBaht(caratW, grossWeightG, illusionSet, diamondColour, diamondClarity);

      const name = `${line} ${formDef.form}`;
      let slug = `${line}-${formDef.form}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Line names repeat across forms, so collisions are expected and get a
      // numeric suffix rather than being regenerated.
      if (usedSlugs.has(slug)) {
        let n = 2;
        while (usedSlugs.has(`${slug}-${n}`)) n += 1;
        slug = `${slug}-${n}`;
      }
      usedSlugs.add(slug);

      const shapeWord = shape.toLowerCase().replace("_", " ");
      const description = [
        `${pick(rng, OPENERS)} ${diamondCount === 1 ? "a single" : diamondCount} ${shapeWord}-cut natural ${diamondCount === 1 ? "diamond" : "diamonds"} totalling ${caratW.toFixed(2)} carat, set in ${metalWord(metal)}.`,
        illusionSet ? pick(rng, ILLUSION_NOTES) : pick(rng, CRAFT_NOTES),
        pick(rng, CLOSERS),
      ].join(" ");

      products.push({
        slug,
        name,
        description,
        category,
        status: "ACTIVE",
        priceMinor: baht * 100,
        currency: "THB",
        grossWeightG,
        metal,
        metalPurity: "18K",
        diamondCount,
        diamondCaratW: caratW,
        diamondColour,
        diamondClarity,
        stoneShape: shape,
        illusionSet,
        isFeatured: false,
        rank: 500,
      });
    }
  }

  // Merchandising pass. One hero per category gets the cinematic treatment the
  // PRD asks for, chosen as the highest-carat illusion piece where there is one
  // — that is the house speciality and the right thing to lead with.
  for (const [category] of DISTRIBUTION) {
    const inCategory = products.filter((p) => p.category === category);
    const hero =
      [...inCategory].sort((a, b) => {
        if (a.illusionSet !== b.illusionSet) return a.illusionSet ? -1 : 1;
        return b.diamondCaratW - a.diamondCaratW;
      })[0] ?? inCategory[0];
    if (hero) {
      hero.isFeatured = true;
      hero.rank = 0;
    }
  }

  // Stable, non-random display order within each category: illusion pieces
  // first, then descending carat.
  products.forEach((product, index) => {
    if (product.rank === 0) return;
    product.rank = 10 + index;
  });

  return products;
}

function metalWord(metal: Metal) {
  return {
    YELLOW_GOLD_18K: "18-karat yellow gold",
    WHITE_GOLD_18K: "18-karat white gold",
    ROSE_GOLD_18K: "18-karat rose gold",
  }[metal];
}
