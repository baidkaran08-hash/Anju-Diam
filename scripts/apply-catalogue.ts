/**
 * Build-time catalogue + studio-login setup. Called from prepare-production.ts.
 *
 * Two jobs, both safe to run on every build:
 *
 *  1. applyCatalogue — loads the house's stock sheet (data/stock-sheet.csv,
 *     200 tagged pieces) and the photographs in public/photos/products. It runs
 *     ONLY while no tagged piece exists yet, so it never overwrites what the
 *     studio later edits (names, sold-out switches, new pieces). The 250
 *     placeholder pieces from the demo seed are archived, not deleted.
 *     Set SKIP_CATALOGUE_IMPORT=1 to disable it outright.
 *
 *  2. secureStudio — if ADMIN_EMAIL + ADMIN_PASSWORD (12+ chars) are set in
 *     the host environment, that account is created/updated as administrator.
 *     The demo login published in the README is then locked if it still has its
 *     default password.
 *
 * Naming/description rules mirror scripts/import-stock-sheet.ts: descriptive
 * names built only from what the sheet says, nothing invented.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const CATEGORY_OF: Record<string, string> = {
  R: "RINGS",
  E: "EARRINGS",
  B: "BRACELETS",
  G: "BRACELETS", // bangles sit with bracelets
  N: "NECKLACES",
};

const NOUN: Record<string, string> = {
  RINGS: "Ring",
  EARRINGS: "Earrings",
  NECKLACES: "Necklace",
  BRACELETS: "Bracelet",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);

function nameFor(category: string, caratW: number) {
  const noun = NOUN[category];
  return caratW > 0 ? `${caratW.toFixed(2)} ct Diamond ${noun}` : `Diamond ${noun}`;
}

function descriptionFor(category: string, caratW: number, goldG: number) {
  const noun = NOUN[category].toLowerCase();
  const parts: string[] = [];
  parts.push(
    caratW > 0
      ? `A ${noun} set with ${caratW.toFixed(2)} carat of natural, earth-mined diamond.`
      : `A ${noun} in the house style, set with natural, earth-mined diamond.`,
  );
  if (goldG > 0) parts.push(`Eighteen-karat gold, ${goldG.toFixed(2)} grams.`);
  parts.push(
    "Held in the Bangkok atelier and available now, with sizing and any alteration finished to your specification. Every stone is natural — never laboratory-grown — and the full specification is confirmed in writing before anything is agreed.",
  );
  return parts.join(" ");
}

type SheetRow = { tag: string; type: string; goldG: number; caratW: number };

function readSheet(): SheetRow[] {
  const file = path.join(process.cwd(), "data", "stock-sheet.csv");
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/).slice(1);
  const seen = new Set<string>();
  const rows: SheetRow[] = [];
  for (const line of lines) {
    const [tag, type, gold, carat] = line.split(",");
    if (!tag || !CATEGORY_OF[type] || seen.has(tag)) continue;
    seen.add(tag);
    rows.push({ tag, type, goldG: Number(gold) || 0, caratW: Number(carat) || 0 });
  }
  return rows;
}

export async function applyCatalogue(prisma: PrismaClient) {
  if (process.env.SKIP_CATALOGUE_IMPORT === "1") {
    console.log("[catalogue] SKIP_CATALOGUE_IMPORT=1 — skipping.");
    return;
  }

  const rows = readSheet();
  if (rows.length === 0) {
    console.warn("[catalogue] data/stock-sheet.csv missing or empty — nothing to import.");
    return;
  }

  const tagged = await prisma.product.count({ where: { sku: { not: null } } });
  if (tagged >= rows.length) {
    console.log(`[catalogue] ${tagged} tagged pieces already present — leaving the catalogue alone.`);
    return;
  }
  const firstRun = tagged === 0;

  // Placeholder demo pieces → archived (hidden from the shop, kept in Studio).
  // First run only: later, a sku-less piece may be one the studio added.
  if (firstRun) {
    const archived = await prisma.product.updateMany({
      where: { sku: null, status: { not: "ARCHIVED" } },
      data: { status: "ARCHIVED", isFeatured: false },
    });
    console.log(`[catalogue] archived ${archived.count} placeholder pieces.`);
  }

  const photoRoot = path.join(process.cwd(), "public", "photos", "products");
  const featuredPerCategory = new Set<string>();
  let created = 0;
  let photos = 0;

  for (const row of rows) {
    const category = CATEGORY_OF[row.type];
    const name = nameFor(category, row.caratW);
    const slug = `${slugify(name)}-${slugify(row.tag)}`;

    const dir = path.join(photoRoot, slug);
    const file = existsSync(dir) ? readdirSync(dir).find((f) => f.endsWith(".webp")) : undefined;

    // One piece per house on the homepage, picked from the photographed,
    // largest-stone pieces first (sheet order is not by size, so sort below).
    const data = {
      sku: row.tag,
      slug,
      name,
      description: descriptionFor(category, row.caratW, row.goldG),
      category,
      status: "ACTIVE",
      priceMinor: 0,
      currency: "THB",
      priceOnEnquiry: true,
      grossWeightG: row.goldG,
      metal: "",
      diamondCount: 0,
      diamondCaratW: row.caratW,
      diamondColour: "",
      diamondClarity: "",
      stoneShape: "",
      madeToOrder: false,
      stock: 1,
      // Photographed pieces first in the default order.
      rank: file ? 100 : 900,
    };

    const product = await prisma.product.upsert({
      where: { slug },
      create: data,
      update: {},
    });
    created += 1;

    if (file) {
      const count = await prisma.productImage.count({ where: { productId: product.id } });
      if (count === 0) {
        await prisma.productImage.create({
          data: { productId: product.id, url: `/photos/products/${slug}/${file}`, alt: name, position: 0 },
        });
        photos += 1;
      }
    }
  }

  // Homepage "One From Each House": the biggest photographed stone per category.
  const photographed = !firstRun ? [] : await prisma.product.findMany({
    where: { sku: { not: null }, images: { some: {} } },
    orderBy: { diamondCaratW: "desc" },
    select: { id: true, category: true },
  });
  for (const p of photographed) {
    if (featuredPerCategory.has(p.category)) continue;
    featuredPerCategory.add(p.category);
    await prisma.product.update({ where: { id: p.id }, data: { isFeatured: true } });
  }

  console.log(`[catalogue] imported ${created} pieces, ${photos} photographs, ${featuredPerCategory.size} featured.`);
}

const DEFAULT_ADMIN_EMAIL = "admin@anjudiam.com";
const DEFAULT_ADMIN_PASSWORD = "changeme-in-production";

export async function secureStudio(prisma: PrismaClient) {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.warn("[studio] ADMIN_EMAIL / ADMIN_PASSWORD not set — studio login unchanged.");
    return;
  }
  if (!email.includes("@") || password.length < 12) {
    console.warn("[studio] ADMIN_EMAIL invalid or ADMIN_PASSWORD under 12 characters — ignored.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, name: "Anju Diam Studio", passwordHash, role: "ADMIN" },
  });
  console.log(`[studio] administrator ready: ${email}`);

  // Lock the published demo login if it is a different account and still default.
  if (email !== DEFAULT_ADMIN_EMAIL) {
    const demo = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN_EMAIL } });
    if (demo && (await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, demo.passwordHash))) {
      await prisma.user.update({
        where: { id: demo.id },
        data: { passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 12) },
      });
      console.log("[studio] default demo login locked.");
    }
  }
}
