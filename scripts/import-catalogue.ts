/**
 * Catalogue importer.
 *
 * Replaces the placeholder catalogue with the client's real product file.
 * Accepts CSV or JSON:
 *
 *   npm run catalogue:import -- data/catalogue.csv
 *   npm run catalogue:import -- data/catalogue.json --replace
 *
 * Flags
 *   --replace   archive every existing product that is not in the file
 *   --dry-run   validate and report, write nothing
 *
 * Columns (header row required for CSV; * = required)
 *
 *   slug*            unique, url-safe; generated from name if omitted
 *   name*
 *   description*
 *   category*        RINGS | EARRINGS | NECKLACES | BRACELETS | BRIDAL
 *   price*           in whole baht, e.g. 148000  (NOT satang)
 *   currency         defaults to THB
 *   grossWeightG*
 *   metal            YELLOW_GOLD_18K | WHITE_GOLD_18K | ROSE_GOLD_18K
 *   metalPurity      defaults to 18K
 *   diamondCount*
 *   diamondCaratW*
 *   diamondColour    D–Z, defaults to G
 *   diamondClarity   IF, VVS1, VVS2, VS1, VS2, SI1…  defaults to VS
 *   stoneShape       ROUND | OVAL | PEAR | EMERALD | MARQUISE | PRINCESS | CUSHION
 *   illusionSet      true/false/yes/no/1/0
 *   isFeatured       true/false — one per category is a good rule
 *   rank             lower sorts first in "Featured"
 *   videoUrl
 *   images           pipe-separated paths or URLs, first is the lead image
 *                    e.g. /products/aurelia-solitaire/01.webp|/products/aurelia-solitaire/02.webp
 *
 * Images
 *   Drop the files under public/products/<slug>/ and reference them as
 *   /products/<slug>/01.webp. Any product with at least one image renders the
 *   photograph; any product without falls back to the generated artwork. There
 *   is nothing to switch on.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { CATEGORIES, METALS, STONE_SHAPES } from "../src/lib/enums";

const prisma = new PrismaClient();

// ── CSV ─────────────────────────────────────────────────────────────────────

/** Minimal RFC-4180 reader: quoted fields, escaped quotes, embedded newlines. */
function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (!header) return [];

  const keys = header.map((key) => key.trim());
  return body.map((cells) =>
    Object.fromEntries(keys.map((key, index) => [key, (cells[index] ?? "").trim()])),
  );
}

// ── Validation ──────────────────────────────────────────────────────────────

const boolish = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") return value;
    if (!value) return false;
    return ["true", "yes", "y", "1"].includes(value.toLowerCase());
  });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const rowSchema = z
  .object({
    slug: z.string().trim().optional(),
    name: z.string().trim().min(1, "name is required").max(160),
    description: z.string().trim().min(1, "description is required"),
    category: z.enum(CATEGORIES),
    price: z.coerce.number().nonnegative("price must be a number in whole baht"),
    currency: z.string().trim().default("THB"),
    grossWeightG: z.coerce.number().nonnegative(),
    metal: z.enum(METALS).default("YELLOW_GOLD_18K"),
    metalPurity: z.string().trim().default("18K"),
    diamondCount: z.coerce.number().int().nonnegative(),
    diamondCaratW: z.coerce.number().nonnegative(),
    diamondColour: z.string().trim().default("G"),
    diamondClarity: z.string().trim().default("VS"),
    stoneShape: z.enum(STONE_SHAPES).default("ROUND"),
    illusionSet: boolish,
    isFeatured: boolish,
    rank: z.coerce.number().int().optional(),
    videoUrl: z.string().trim().optional(),
    images: z.string().trim().optional(),
  })
  .transform((row) => ({
    ...row,
    slug: row.slug && row.slug.length > 0 ? slugify(row.slug) : slugify(row.name),
    priceMinor: Math.round(row.price * 100),
    imageList: (row.images ?? "")
      .split("|")
      .map((url) => url.trim())
      .filter(Boolean),
  }));

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));
  const replace = args.includes("--replace");
  const dryRun = args.includes("--dry-run");

  if (!file) {
    console.error(
      "Usage: npm run catalogue:import -- <file.csv|file.json> [--replace] [--dry-run]",
    );
    process.exit(1);
  }

  const raw = await readFile(path.resolve(file), "utf8");
  const records: unknown[] = file.endsWith(".json") ? JSON.parse(raw) : parseCsv(raw);

  if (!Array.isArray(records) || records.length === 0) {
    console.error(`No rows found in ${file}.`);
    process.exit(1);
  }

  // Validate everything before writing anything — a half-imported catalogue is
  // far worse than a rejected one.
  const parsed: z.infer<typeof rowSchema>[] = [];
  const problems: string[] = [];

  records.forEach((record, index) => {
    const result = rowSchema.safeParse(record);
    if (result.success) parsed.push(result.data);
    else {
      for (const issue of result.error.issues) {
        problems.push(`  row ${index + 2}: ${issue.path.join(".") || "row"} — ${issue.message}`);
      }
    }
  });

  const seen = new Set<string>();
  for (const row of parsed) {
    if (seen.has(row.slug)) problems.push(`  duplicate slug: ${row.slug}`);
    seen.add(row.slug);
  }

  // Advisory only — the house standard is a commercial promise, not a schema
  // rule, and the client may legitimately list something below it.
  const belowStandard = parsed.filter(
    (row) => !["D", "E", "F", "G"].includes(row.diamondColour.toUpperCase()),
  );

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) found — nothing was written:\n`);
    console.error(problems.slice(0, 40).join("\n"));
    if (problems.length > 40) console.error(`  …and ${problems.length - 40} more`);
    process.exit(1);
  }

  console.log(`${parsed.length} rows validated.`);
  if (belowStandard.length > 0) {
    console.warn(
      `  note: ${belowStandard.length} piece(s) are below the stated house standard of G colour.`,
    );
  }

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    console.table(
      parsed.slice(0, 5).map((row) => ({
        slug: row.slug,
        category: row.category,
        baht: row.price,
        ct: row.diamondCaratW,
        images: row.imageList.length,
      })),
    );
    return;
  }

  let created = 0;
  let updated = 0;

  for (const row of parsed) {
    const data = {
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      status: "ACTIVE",
      priceMinor: row.priceMinor,
      currency: row.currency,
      grossWeightG: row.grossWeightG,
      metal: row.metal,
      metalPurity: row.metalPurity,
      diamondCount: row.diamondCount,
      diamondCaratW: row.diamondCaratW,
      diamondColour: row.diamondColour.toUpperCase(),
      diamondClarity: row.diamondClarity.toUpperCase(),
      stoneShape: row.stoneShape,
      illusionSet: row.illusionSet,
      isFeatured: row.isFeatured,
      rank: row.rank ?? 500,
      videoUrl: row.videoUrl || null,
    };

    const existing = await prisma.product.findUnique({ where: { slug: row.slug } });
    const product = await prisma.product.upsert({
      where: { slug: row.slug },
      create: data,
      update: data,
    });
    existing ? (updated += 1) : (created += 1);

    // Images are replaced wholesale rather than merged — the file is the
    // source of truth, and merging would strand deleted photographs.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (row.imageList.length > 0) {
      await prisma.productImage.createMany({
        data: row.imageList.map((url, position) => ({
          productId: product.id,
          url,
          alt: row.name,
          position,
        })),
      });
    }
  }

  let archived = 0;
  if (replace) {
    const result = await prisma.product.updateMany({
      where: { slug: { notIn: [...seen] }, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    archived = result.count;
  }

  console.log(`\nCreated  ${created}`);
  console.log(`Updated  ${updated}`);
  if (replace) console.log(`Archived ${archived} product(s) absent from the file`);
  console.log(
    `\nProducts with photography: ${parsed.filter((row) => row.imageList.length > 0).length}/${parsed.length}` +
      ` — the rest fall back to generated artwork.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
