/**
 * Catalogue importer.
 *
 * Replaces the placeholder catalogue with the client's real product file.
 * Accepts a local CSV or JSON file, or a Google Sheet URL:
 *
 *   npm run catalogue:import -- data/catalogue.csv
 *   npm run catalogue:import -- data/catalogue.json --replace
 *   npm run catalogue:import -- "https://docs.google.com/spreadsheets/d/ID/edit#gid=0"
 *
 * Google Sheets
 *   Paste the ordinary browser URL. The sheet has to be readable without
 *   signing in — in Share, set "Anyone with the link" to Viewer. Nothing is
 *   written back to it, and the tab in the URL (#gid=) is the tab imported, so
 *   a workbook with several tabs imports the one you were looking at.
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
 *   category*        RINGS | EARRINGS | NECKLACES | BRACELETS | GIFTING
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
 *   madeToOrder      true/false, defaults TRUE — the house norm. A made-to-order
 *                    piece is always orderable and ignores every count below.
 *   stock            units on hand; only read when madeToOrder is false and the
 *                    piece has no options
 *   variantAxis      what the options vary by, e.g. "Ring size". Blank = one-of-one
 *   variants         pipe-separated  label:stock:price
 *                    price is optional and in whole baht; blank means "same as
 *                    the piece"      e.g.  US 6:2|US 6.5:1|US 7:0:104000
 *   certificates     pipe-separated  lab:number:carat:colour:clarity
 *                    everything after the number is optional
 *                    e.g.  GIA:2141438171:0.72:G:VS1
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

import { CATEGORIES, CERT_LABS, METALS, STONE_SHAPES } from "../src/lib/enums";

const prisma = new PrismaClient();

// ── Source ──────────────────────────────────────────────────────────────────

/**
 * Turns a Google Sheets browser URL into its CSV export URL.
 *
 * The tab is carried on the fragment (#gid=0), which is never sent to a server,
 * so it has to be lifted into the query here or every import would silently
 * take the first tab regardless of which one was open.
 */
function googleSheetCsvUrl(raw: string): string | null {
  const match = raw.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const id = match[1]!;
  const gid = raw.match(/[#&?]gid=(\d+)/)?.[1];

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
}

/** Returns the file's text and whether it should be parsed as JSON. */
async function readSource(source: string): Promise<{ text: string; json: boolean }> {
  if (!/^https?:\/\//i.test(source)) {
    return { text: await readFile(path.resolve(source), "utf8"), json: source.endsWith(".json") };
  }

  const sheetUrl = googleSheetCsvUrl(source);
  const url = sheetUrl ?? source;

  const response = await fetch(url, { redirect: "follow" });

  if (!response.ok) {
    if (sheetUrl && (response.status === 401 || response.status === 403 || response.status === 404)) {
      throw new Error(
        "Google would not serve that sheet without signing in.\n" +
          "  In the sheet: Share -> General access -> Anyone with the link -> Viewer.\n" +
          "  Nothing is written back to it; this only ever reads.",
      );
    }
    throw new Error(`${url} returned ${response.status}.`);
  }

  const text = await response.text();

  // A sign-in wall answers 200 with an HTML page, so the status alone is not
  // enough — without this the importer would report "0 rows found" and leave
  // you hunting for a problem in the sheet itself.
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error(
      "That URL returned a web page, not data.\n" +
        "  If it is a Google Sheet, set Share -> Anyone with the link -> Viewer.",
    );
  }

  return { text, json: !sheetUrl && source.endsWith(".json") };
}

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

/**
 * Like `boolish`, but blank means true. Used for madeToOrder, where an absent
 * column has to mean "the house norm" rather than "count this piece" — the
 * latter would take the whole catalogue off sale on the first import.
 */
const boolishTrue = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") return value;
    if (value === undefined || value.trim() === "") return true;
    return !["false", "no", "n", "0"].includes(value.trim().toLowerCase());
  });

export type ParsedVariant = { label: string; stock: number; priceMinor: number | null };
export type ParsedCertificate = {
  lab: string;
  number: string;
  caratW: number | null;
  colour: string | null;
  clarity: string | null;
};

/** `US 6:2|US 6.5:1|US 7:0:104000` -> rows. Price is in whole baht. */
function parseVariants(raw: string): ParsedVariant[] {
  return raw
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [label = "", stock = "", price = ""] = entry.split(":").map((part) => part.trim());
      return {
        label,
        stock: Number(stock) || 0,
        priceMinor: price === "" ? null : Math.round(Number(price) * 100),
      };
    })
    .filter((variant) => variant.label !== "");
}

/** `GIA:2141438171:0.72:G:VS1|IGI:123` -> rows. Only lab and number are required. */
function parseCertificates(raw: string): ParsedCertificate[] {
  return raw
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [lab = "", number = "", carat = "", colour = "", clarity = ""] = entry
        .split(":")
        .map((part) => part.trim());
      return {
        lab: lab.toUpperCase(),
        number,
        caratW: carat === "" ? null : Number(carat),
        colour: colour === "" ? null : colour.toUpperCase(),
        clarity: clarity === "" ? null : clarity.toUpperCase(),
      };
    })
    .filter((certificate) => certificate.number !== "");
}

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
    madeToOrder: boolishTrue,
    stock: z.coerce.number().int().nonnegative().optional(),
    variantAxis: z.string().trim().optional(),
    variants: z.string().trim().optional(),
    certificates: z.string().trim().optional(),
  })
  .transform((row) => ({
    ...row,
    slug: row.slug && row.slug.length > 0 ? slugify(row.slug) : slugify(row.name),
    priceMinor: Math.round(row.price * 100),
    imageList: (row.images ?? "")
      .split("|")
      .map((url) => url.trim())
      .filter(Boolean),
    variantList: parseVariants(row.variants ?? ""),
    certificateList: parseCertificates(row.certificates ?? ""),
  }))
  .superRefine((row, ctx) => {
    const seen = new Set<string>();
    for (const variant of row.variantList) {
      const key = variant.label.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: `option "${variant.label}" is listed twice`,
        });
      }
      seen.add(key);
    }

    for (const certificate of row.certificateList) {
      if (!CERT_LABS.includes(certificate.lab as (typeof CERT_LABS)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["certificates"],
          message: `unknown laboratory "${certificate.lab}" — use one of ${CERT_LABS.join(", ")}`,
        });
      }
    }
  });

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));
  const replace = args.includes("--replace");
  const dryRun = args.includes("--dry-run");

  if (!file) {
    console.error(
      "Usage: npm run catalogue:import -- <file.csv|file.json|google-sheet-url> [--replace] [--dry-run]",
    );
    process.exit(1);
  }

  let raw: string;
  let asJson: boolean;
  try {
    const source = await readSource(file);
    raw = source.text;
    asJson = source.json;
  } catch (error) {
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  const records: unknown[] = asJson ? JSON.parse(raw) : parseCsv(raw);

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
        options: row.variantList.length,
        reports: row.certificateList.length,
        stock: row.madeToOrder ? "made to order" : row.stock ?? 0,
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
      madeToOrder: row.madeToOrder,
      stock: row.stock ?? 0,
      variantAxis: row.variantAxis || null,
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

    // Options are matched by label rather than replaced, so an option that
    // survives a re-import keeps its id — and stays in anyone's cart. Only a
    // row that has genuinely gone is deleted.
    if (row.variantList.length > 0 || row.variantAxis) {
      const existing = await prisma.productVariant.findMany({
        where: { productId: product.id },
      });
      const byLabel = new Map(existing.map((variant) => [variant.label.toLowerCase(), variant]));
      const kept: string[] = [];

      for (const [position, variant] of row.variantList.entries()) {
        const data = {
          label: variant.label,
          stock: variant.stock,
          priceMinor: variant.priceMinor,
          position,
        };
        const match = byLabel.get(variant.label.toLowerCase());

        const saved = match
          ? await prisma.productVariant.update({ where: { id: match.id }, data })
          : await prisma.productVariant.create({ data: { productId: product.id, ...data } });

        kept.push(saved.id);
      }

      await prisma.productVariant.deleteMany({
        where: { productId: product.id, id: { notIn: kept.length ? kept : ["__none__"] } },
      });
    }

    // Reports carry an uploaded scan that the file cannot know about, so a row
    // already on the piece keeps its documentUrl when the same report number
    // comes back round.
    if (row.certificateList.length > 0) {
      const existing = await prisma.certificate.findMany({ where: { productId: product.id } });
      const byNumber = new Map(existing.map((row_) => [row_.number.toLowerCase(), row_]));

      await prisma.certificate.deleteMany({ where: { productId: product.id } });
      await prisma.certificate.createMany({
        data: row.certificateList.map((certificate, position) => ({
          productId: product.id,
          lab: certificate.lab,
          number: certificate.number,
          documentUrl: byNumber.get(certificate.number.toLowerCase())?.documentUrl ?? null,
          caratW: certificate.caratW,
          colour: certificate.colour,
          clarity: certificate.clarity,
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
  console.log(
    `Products with options:    ${parsed.filter((row) => row.variantList.length > 0).length}/${parsed.length}`,
  );
  console.log(
    `Products with reports:    ${parsed.filter((row) => row.certificateList.length > 0).length}/${parsed.length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
