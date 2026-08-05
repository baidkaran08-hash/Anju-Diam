import { PrismaClient, Category, Metal, ProductStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seeds a catalogue of ~250 pieces so search, filters and pagination can be
 * exercised before the client's real inventory arrives.
 *
 * Every generated piece respects the house standard stated in the brand
 * write-up: 18-karat gold, G colour or better, VS clarity or better.
 */

const SHAPES = ["Round Brilliant", "Princess", "Oval", "Pear", "Marquise", "Emerald", "Cushion"];
const MOODS = ["Aurora", "Lumen", "Solstice", "Verity", "Halo", "Meridian", "Reverie", "Cascade", "Astra", "Élan"];
const COLOURS = ["D", "E", "F", "G"];
const CLARITIES = ["IF", "VVS1", "VVS2", "VS1", "VS2"];
const METALS: Metal[] = [Metal.YELLOW_GOLD_18K, Metal.WHITE_GOLD_18K, Metal.ROSE_GOLD_18K];

const PLAN: Record<Category, { count: number; caratRange: [number, number]; weightRange: [number, number] }> = {
  [Category.RINGS]: { count: 70, caratRange: [0.3, 2.2], weightRange: [2.1, 6.4] },
  [Category.EARRINGS]: { count: 55, caratRange: [0.4, 3.0], weightRange: [2.8, 8.2] },
  [Category.NECKLACES]: { count: 50, caratRange: [0.25, 1.8], weightRange: [1.8, 5.6] },
  [Category.BRACELETS]: { count: 45, caratRange: [1.5, 6.0], weightRange: [6.5, 18.0] },
  [Category.BRIDAL]: { count: 30, caratRange: [0.5, 3.5], weightRange: [2.4, 7.8] },
};

// Deterministic pseudo-random so re-seeding produces the same catalogue.
let seedState = 20260801;
function rand() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number, dp = 2) =>
  Number((min + rand() * (max - min)).toFixed(dp));

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function metalLabel(metal: Metal) {
  return {
    [Metal.YELLOW_GOLD_18K]: "18K yellow gold",
    [Metal.WHITE_GOLD_18K]: "18K white gold",
    [Metal.ROSE_GOLD_18K]: "18K rose gold",
  }[metal];
}

async function main() {
  console.log("Clearing existing catalogue…");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();

  const rows = [];
  let n = 0;

  for (const [category, config] of Object.entries(PLAN) as [Category, typeof PLAN[Category]][]) {
    for (let i = 0; i < config.count; i += 1) {
      n += 1;
      const shape = pick(SHAPES);
      const mood = pick(MOODS);
      const metal = pick(METALS);
      const illusionSet = rand() > 0.45;
      const carat = between(config.caratRange[0], config.caratRange[1]);
      const weight = between(config.weightRange[0], config.weightRange[1], 1);
      const stones = Math.max(1, Math.round(carat * (illusionSet ? 22 : 6)));

      // BRIDAL is already singular; the rest are plural enum names.
      const NOUNS: Record<Category, string> = {
        [Category.RINGS]: "Ring",
        [Category.EARRINGS]: "Earrings",
        [Category.NECKLACES]: "Necklace",
        [Category.BRACELETS]: "Bracelet",
        [Category.BRIDAL]: "Bridal Ring",
      };
      const noun = NOUNS[category];
      const name = `${mood} ${shape} ${noun}`;
      const slug = `${slugify(name)}-${String(n).padStart(3, "0")}`;

      // Rough THB pricing: stone weight dominates, metal weight contributes.
      const priceMinor = Math.round((carat * 78000 + weight * 3400 + 12000) * 100);

      rows.push({
        slug,
        name,
        description:
          `A ${metalLabel(metal)} ${noun.toLowerCase()} set with ${shape.toLowerCase()} diamonds ` +
          `totalling ${carat} carat. ${illusionSet
            ? "Built on our illusion setting, which gathers light across the surface to maximise brilliance and visual scale while keeping the piece light to wear."
            : "A classic setting, cut and finished by hand in our Bangkok atelier."} ` +
          `Every stone is selected for brilliance, purity and beauty without compromise. Fully customisable — metal, stone size and proportion can all be adapted.`,
        category,
        status: ProductStatus.ACTIVE,
        priceMinor,
        currency: "THB",
        grossWeightG: weight,
        metal,
        metalPurity: "18K",
        diamondCount: stones,
        diamondCaratW: carat,
        diamondColour: pick(COLOURS),
        diamondClarity: pick(CLARITIES),
        illusionSet,
        images: [`/products/${slug}-01.webp`, `/products/${slug}-02.webp`],
        isFeatured: i < 2, // one hero piece per category gets the cinematic treatment
      });
    }
  }

  await prisma.product.createMany({ data: rows });
  console.log(`Seeded ${rows.length} products.`);

  const adminEmail = "admin@anjudiam.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Anju Diam Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("change-me-on-first-login", 10),
    },
  });
  console.log(`Admin account ready: ${adminEmail} / change-me-on-first-login`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
