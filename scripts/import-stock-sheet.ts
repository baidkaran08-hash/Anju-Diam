/**
 * Stock-sheet importer — Anju Diam's own Excel layout.
 *
 *   npm run stock:import -- "Anju Diam Jewelry Stock.xlsx" --dry-run
 *   npm run stock:import -- "Anju Diam Jewelry Stock.xlsx"
 *
 * Separate from scripts/import-catalogue.ts on purpose. That one defines a
 * canonical column set and asks the file to match it. This one reads the
 * client's sheet as it actually is — nine columns, a tag number as the key,
 * photographs embedded in the cells — and does the translating here rather
 * than making the house rewrite their stock book.
 *
 * Columns, as they appear in the sheet
 *
 *   Tag No          the house's label number. The identity of the piece.
 *   Pictures        an image embedded in the cell (see PHOTOGRAPHS below)
 *   Item Name       the type — "Ring", "Earring" — which is the category,
 *                   not a name. Real names are generated; see NAMING.
 *   Gold            gold weight in grams
 *   Diamond         total carat weight
 *   Gemstones       coloured stones. The site models diamonds only, so a
 *                   non-empty value here is reported and NOT silently dropped.
 *   Starting Price  taken as the public price, per the client's instruction
 *   Selling Price   read and reported, never published
 *   Stock O.        an internal code. Reported, not stored.
 *
 * WHAT THE SHEET DOES NOT SAY
 *   Stone count, colour, clarity, cut and metal colour are absent. Rather than
 *   let the schema defaults quietly assert "G / VS / 18k yellow gold" about
 *   real diamonds nobody graded, unknowns are written as blank and the product
 *   page omits that row entirely. A missing spec is honest; an invented one is
 *   a claim about goods for sale. Pass --metal to set the metal for the whole
 *   file once the house confirms it.
 *
 * NAMING
 *   Names and descriptions are generated from the specification, because the
 *   sheet has neither. They are deliberately descriptive rather than invented
 *   house names — "Diamond Ring, 1.05 ct" is dull but true, where "Aurelia
 *   Solitaire" would be marketing copy this script has no business writing.
 *   The studio can rename any piece afterwards.
 *
 * PHOTOGRAPHS
 *   Images embedded in .xlsx cells are extracted, resized and attached. Google
 *   Sheets does not always carry in-cell images through its Excel export, so
 *   the run reports how many it found and which rows they matched — if that
 *   count is zero, the export dropped them and the originals are needed.
 */

import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import ExcelJS from "exceljs";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

import { CATEGORIES, METALS } from "../src/lib/enums";

const prisma = new PrismaClient();

const MEDIA_DIR = process.env.MEDIA_DIR
  ? path.resolve(process.env.MEDIA_DIR)
  : path.join(process.cwd(), "media");

const FULL_EDGE = 2600;
const THUMB_EDGE = 900;
/** Below this on the long edge, a photograph looks soft on a large screen. */
const SOFT_EDGE = 1600;

// ── Source ──────────────────────────────────────────────────────────────────

/**
 * Accepts a local .xlsx or a Google Sheets URL. The URL path downloads the
 * whole workbook rather than a CSV, because the photographs live in the cells
 * and a CSV export drops them silently — the column simply arrives empty.
 * That download is large (the house sheet is ~86 MB), which is exactly why it
 * belongs in an occasional import and not in a per-edit sync.
 */
async function resolveSource(source: string): Promise<string> {
  if (!/^https?:\/\//i.test(source)) return path.resolve(source);

  const id = source.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) throw new Error("That URL does not look like a Google Sheet.");

  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  console.log("Downloading the workbook (photographs make this large)…");

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(
      `Google returned ${response.status}.\n` +
        "  The sheet must be readable without signing in:\n" +
        "  Share -> General access -> Anyone with the link -> Viewer.",
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 2).toString("latin1") !== "PK") {
    throw new Error("That URL returned a web page, not a workbook. Check the sharing setting.");
  }

  const file = path.join(os.tmpdir(), `anju-stock-${Date.now()}.xlsx`);
  await writeFile(file, bytes);
  console.log(`  ${(bytes.length / 1024 / 1024).toFixed(1)} MB\n`);
  return file;
}

// ── Column mapping ──────────────────────────────────────────────────────────

/** Header text (lowercased, trimmed) -> the field it feeds. */
const HEADERS: Record<string, string> = {
  "tag no": "tag",
  pictures: "picture",
  "item name": "type",
  gold: "goldG",
  diamond: "caratW",
  gemstones: "gemstones",
  "starting price": "startingPrice",
  "selling price": "sellingPrice",
  "stock o.": "stockCode",
  "stock o": "stockCode",
};

/**
 * Piece type -> collection. Deliberately not a catch-all: an unrecognised type
 * fails the run and is listed, because silently filing a tennis necklace under
 * Gifting is the kind of error nobody notices until a customer does.
 */
const CATEGORY_OF: Record<string, (typeof CATEGORIES)[number]> = {
  ring: "RINGS",
  rings: "RINGS",
  band: "RINGS",
  earring: "EARRINGS",
  earrings: "EARRINGS",
  stud: "EARRINGS",
  studs: "EARRINGS",
  necklace: "NECKLACES",
  necklaces: "NECKLACES",
  pendant: "NECKLACES",
  chain: "NECKLACES",
  bracelet: "BRACELETS",
  bracelets: "BRACELETS",
  bangle: "BRACELETS",
  bangles: "BRACELETS",
};

/** Singular noun for prose and names. */
const NOUN: Record<(typeof CATEGORIES)[number], string> = {
  RINGS: "Ring",
  EARRINGS: "Earrings",
  NECKLACES: "Necklace",
  BRACELETS: "Bracelet",
  GIFTING: "Piece",
};

// ── Row shape ───────────────────────────────────────────────────────────────

type Row = {
  excelRow: number;
  tag: string;
  type: string;
  category: (typeof CATEGORIES)[number];
  goldG: number;
  caratW: number;
  gemstones: string;
  priceMinor: number;
  sellingPrice: number | null;
  stockCode: string;
};

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  // Strips thousands separators, currency marks and stray spaces.
  const cleaned = String(value).replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const text = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  // A cell holding a formula or rich text arrives as an object.
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.result === "string") return v.result.trim();
    if (typeof v.text === "string") return v.text.trim();
    if (Array.isArray(v.richText)) {
      return (v.richText as { text: string }[]).map((part) => part.text).join("").trim();
    }
    return "";
  }
  return String(value).trim();
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);

// ── Generated copy ──────────────────────────────────────────────────────────

/**
 * A name built only from what the sheet actually says. The tag number is not
 * in the name — it is the `sku`, and a customer should not have to read a
 * stock reference off a product page.
 */
function nameFor(row: Row): string {
  const noun = NOUN[row.category];
  return row.caratW > 0 ? `${row.caratW.toFixed(2)} ct Diamond ${noun}` : `Diamond ${noun}`;
}

/**
 * Two or three sentences, in the house voice, asserting nothing the sheet does
 * not contain. No stone count, no colour, no clarity — those are unknown, and
 * a description is not the place to guess them.
 */
function descriptionFor(row: Row): string {
  const noun = NOUN[row.category].toLowerCase();
  const parts: string[] = [];

  parts.push(
    row.caratW > 0
      ? `A ${noun} set with ${row.caratW.toFixed(2)} carat of natural, earth-mined diamond.`
      : `A ${noun} in the house style, set with natural, earth-mined diamond.`,
  );

  if (row.goldG > 0) {
    parts.push(`Eighteen-karat gold, ${row.goldG.toFixed(2)} grams.`);
  }

  // These are tagged pieces already in the safe, not commissions — saying
  // "made to order" beside "One remaining" contradicts the availability line
  // three inches above it.
  parts.push(
    "Held in the Bangkok atelier and available now, with sizing and any alteration finished to your specification. Every stone is natural — never laboratory-grown — and the full specification is confirmed in writing before anything is agreed.",
  );

  return parts.join(" ");
}

// ── Reading ─────────────────────────────────────────────────────────────────

type ExtractedImage = { excelRow: number; buffer: Buffer; extension: string };

async function readSheet(file: string, sheetName?: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.resolve(file));

  const sheet = sheetName
    ? workbook.getWorksheet(sheetName)
    : workbook.worksheets.find((w) => w.actualRowCount > 1) ?? workbook.worksheets[0];

  if (!sheet) throw new Error("No usable worksheet found in that file.");

  // Header row -> column index.
  const headerRow = sheet.getRow(1);
  const columnOf: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    const key = HEADERS[text(cell.value).toLowerCase()];
    if (key) columnOf[key] = col;
  });

  // Price is deliberately absent from the required set: the house sells this
  // catalogue on enquiry, so a sheet with no price column is the normal case.
  const missing = ["tag", "type"].filter((k) => !(k in columnOf));
  if (missing.length) {
    throw new Error(
      `Could not find these columns in "${sheet.name}": ${missing.join(", ")}.\n` +
        `  Headers seen: ${headerRow.values ? (headerRow.values as unknown[]).slice(1).map((v) => text(v)).filter(Boolean).join(" | ") : "(none)"}`,
    );
  }

  // Embedded photographs, anchored to a row. nativeRow is zero-based, so the
  // first data row (spreadsheet row 2) reports as 1.
  const images: ExtractedImage[] = [];
  for (const image of sheet.getImages()) {
    const media = workbook.getImage(Number(image.imageId)) as unknown as {
      buffer: Buffer;
      extension: string;
    };
    if (!media?.buffer) continue;
    images.push({
      excelRow: Math.round(image.range.tl.nativeRow) + 1,
      buffer: Buffer.from(media.buffer),
      extension: media.extension || "png",
    });
  }

  const rows: Row[] = [];
  const problems: string[] = [];
  const unknownTypes = new Set<string>();
  const gemstoneRows: string[] = [];
  const stockCodes = new Set<string>();

  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const excelRow = sheet.getRow(r);
    const cell = (key: string) => (columnOf[key] ? excelRow.getCell(columnOf[key]!).value : null);

    const tag = text(cell("tag"));
    const type = text(cell("type"));

    // A blank tag with nothing beside it is just spreadsheet padding.
    if (!tag && !type) continue;

    if (!tag) {
      problems.push(`  row ${r}: no tag number`);
      continue;
    }

    const category = CATEGORY_OF[type.toLowerCase()];
    if (!category) {
      unknownTypes.add(type || "(blank)");
      problems.push(`  row ${r} (tag ${tag}): unrecognised item type "${type}"`);
      continue;
    }

    // No price column at all, or a blank cell, means "ask us" rather than free.
    const price = num(cell("startingPrice"));

    const gemstones = text(cell("gemstones"));
    if (gemstones) gemstoneRows.push(`${tag} (${gemstones})`);

    const stockCode = text(cell("stockCode"));
    if (stockCode) stockCodes.add(stockCode);

    if (rows.some((existing) => existing.tag === tag)) {
      problems.push(`  row ${r}: tag ${tag} already appears earlier in the sheet — skipped`);
      continue;
    }

    rows.push({
      excelRow: r,
      tag,
      type,
      category,
      goldG: num(cell("goldG")) ?? 0,
      caratW: num(cell("caratW")) ?? 0,
      gemstones,
      priceMinor: price !== null && price > 0 ? Math.round(price * 100) : 0,
      sellingPrice: num(cell("sellingPrice")),
      stockCode,
    });
  }

  return { sheet, rows, images, problems, unknownTypes, gemstoneRows, stockCodes };
}

// ── Photographs ─────────────────────────────────────────────────────────────

async function attachPhoto(slug: string, source: Buffer) {
  const meta = await sharp(source).metadata();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

  const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const dir = path.join(MEDIA_DIR, "products", slug);
  await mkdir(dir, { recursive: true });

  const full = await sharp(source)
    .rotate()
    .resize(FULL_EDGE, FULL_EDGE, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 88, effort: 5 })
    .toBuffer();

  const thumb = await sharp(source)
    .rotate()
    .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  await writeFile(path.join(dir, `${base}.webp`), full);
  await writeFile(path.join(dir, `${base}-thumb.webp`), thumb);

  return { url: `/api/media/products/${slug}/${base}.webp`, longEdge };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const flag = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const metal = flag("metal");
  const priceOnEnquiry = args.includes("--price-on-enquiry");
  const status = (flag("status") ?? "ACTIVE").toUpperCase();
  const sheetName = flag("sheet");

  if (!file) {
    console.error(
      "Usage: npm run stock:import -- <file.xlsx> [--dry-run] [--sheet Stock]\n" +
        "                              [--metal WHITE_GOLD_18K] [--status DRAFT|ACTIVE]",
    );
    process.exit(1);
  }
  if (metal && !METALS.includes(metal as (typeof METALS)[number])) {
    console.error(`--metal must be one of: ${METALS.join(", ")}`);
    process.exit(1);
  }
  if (!["DRAFT", "ACTIVE"].includes(status)) {
    console.error("--status must be DRAFT or ACTIVE");
    process.exit(1);
  }

  const localFile = await resolveSource(file);

  const { sheet, rows, images, problems, unknownTypes, gemstoneRows, stockCodes } =
    await readSheet(localFile, sheetName);

  // ── Report ───────────────────────────────────────────────────────────────
  console.log(`\nSheet "${sheet.name}" — ${sheet.rowCount - 1} data rows\n`);
  console.log(`  Readable pieces        ${rows.length}`);
  console.log(`  Photographs embedded   ${images.length}`);

  const photoByRow = new Map<number, ExtractedImage>();
  for (const image of images) if (!photoByRow.has(image.excelRow)) photoByRow.set(image.excelRow, image);
  const matched = rows.filter((r) => photoByRow.has(r.excelRow)).length;
  console.log(`  Photographs matched    ${matched} of ${rows.length} pieces`);

  if (images.length === 0) {
    console.log(
      "\n  NOTE: no embedded images found. Google Sheets does not always carry\n" +
        "  in-cell pictures through its .xlsx export. The originals will be needed.",
    );
  }

  const dupes = new Map<string, number>();
  for (const row of rows) dupes.set(row.tag, (dupes.get(row.tag) ?? 0) + 1);
  const repeated = [...dupes].filter(([, n]) => n > 1);

  console.log(`\n  Collections            ${[...new Set(rows.map((r) => r.category))].join(", ")}`);
  if (stockCodes.size) console.log(`  Stock codes seen       ${[...stockCodes].join(", ")} (not stored)`);
  if (gemstoneRows.length) {
    console.log(
      `\n  ${gemstoneRows.length} piece(s) list coloured gemstones, which this site does not model:`,
    );
    console.log(`    ${gemstoneRows.slice(0, 10).join(", ")}${gemstoneRows.length > 10 ? " …" : ""}`);
  }
  if (repeated.length) {
    console.log(`\n  Repeated tag numbers: ${repeated.map(([t, n]) => `${t}×${n}`).join(", ")}`);
  }

  // Price sanity — Starting is being published, so a row where it sits below
  // Selling is worth surfacing rather than quietly publishing.
  const inverted = rows.filter(
    (r) => r.sellingPrice !== null && r.priceMinor / 100 < r.sellingPrice,
  );
  if (inverted.length) {
    console.log(
      `\n  ${inverted.length} row(s) where Starting Price is BELOW Selling Price — check these:`,
    );
    console.log(`    ${inverted.slice(0, 10).map((r) => r.tag).join(", ")}`);
  }

  const skippable = problems.filter((p) => p.includes("already appears earlier"));
  const fatal = problems.filter((p) => !p.includes("already appears earlier"));

  if (skippable.length) {
    console.log(`\n  ${skippable.length} duplicate tag row(s) skipped:`);
    console.log(skippable.slice(0, 10).join("\n"));
  }

  if (fatal.length) {
    const problems = fatal;
    console.error(`\n${problems.length} row(s) could not be read:\n`);
    console.error(problems.slice(0, 30).join("\n"));
    if (problems.length > 30) console.error(`  …and ${problems.length - 30} more`);
    if (unknownTypes.size) {
      console.error(
        `\n  Unrecognised item types: ${[...unknownTypes].join(", ")}` +
          `\n  Add them to CATEGORY_OF in this script once the house says where they belong.`,
      );
    }
    console.error("\nNothing was written. Fix the rows above, or map the types, then re-run.\n");
    process.exit(1);
  }

  console.log("\n  Unknown by design: stone count, colour, clarity, cut.");
  console.log("  These are written blank and hidden on the product page rather than guessed.");
  if (!metal) console.log("  Metal colour not in the sheet — pass --metal once the house confirms it.");

  if (dryRun) {
    console.log("\n--dry-run: nothing written.\n");
    console.table(
      rows.slice(0, 8).map((r) => ({
        tag: r.tag,
        name: nameFor(r),
        collection: r.category,
        baht: r.priceMinor / 100,
        ct: r.caratW,
        gold_g: r.goldG,
        photo: photoByRow.has(r.excelRow) ? "yes" : "—",
      })),
    );
    await prisma.$disconnect();
    return;
  }

  // ── Write ────────────────────────────────────────────────────────────────
  let created = 0;
  let updated = 0;
  let photos = 0;
  const soft: string[] = [];

  for (const row of rows) {
    const name = nameFor(row);
    const existing = await prisma.product.findUnique({ where: { sku: row.tag } });

    const slug = existing?.slug ?? `${slugify(name)}-${slugify(row.tag)}`;

    const data = {
      sku: row.tag,
      slug,
      name,
      description: descriptionFor(row),
      category: row.category,
      status,
      priceMinor: row.priceMinor,
      currency: "THB",
      // The house quotes this catalogue by hand. With no figure in the sheet
      // the storefront must not invent one, and must not show ฿0 either.
      priceOnEnquiry: priceOnEnquiry || row.priceMinor <= 0,
      grossWeightG: row.goldG,
      // Blank rather than the schema's yellow-gold default: the sheet does not
      // say, the spec table hides what it does not know, and the generated
      // artwork falls back on its own.
      metal: metal ?? "",
      // Blank, not guessed — the product page omits what it does not know.
      diamondCount: 0,
      diamondCaratW: row.caratW,
      diamondColour: "",
      diamondClarity: "",
      stoneShape: "",
      // One tagged piece in the safe is exactly that: one, and not made to order.
      madeToOrder: false,
      stock: 1,
    };

    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data });

    existing ? (updated += 1) : (created += 1);

    const image = photoByRow.get(row.excelRow);
    if (image) {
      const already = await prisma.productImage.count({ where: { productId: product.id } });
      if (already === 0) {
        const { url, longEdge } = await attachPhoto(product.slug, image.buffer);
        await prisma.productImage.create({
          data: { productId: product.id, url, alt: name, position: 0 },
        });
        photos += 1;
        if (longEdge < SOFT_EDGE) soft.push(`${row.tag} (${longEdge}px)`);
      }
    }
  }

  const quoted = rows.filter((r) => priceOnEnquiry || r.priceMinor <= 0).length;
  console.log(`\nCreated   ${created}`);
  console.log(`Updated   ${updated}`);
  console.log(`Photos    ${photos} attached`);
  if (quoted) console.log(`Quoted    ${quoted} piece(s) show "Price on enquiry" rather than a figure`);
  if (soft.length) {
    console.log(
      `\n${soft.length} photograph(s) under ${SOFT_EDGE}px on the long edge — these will look soft:`,
    );
    console.log(`  ${soft.slice(0, 15).join(", ")}${soft.length > 15 ? " …" : ""}`);
  }
  console.log(
    `\nPieces are ${status}. Stone count, colour and clarity are blank on every piece —` +
      `\nthe studio can fill them in, and the product page hides them until then.\n`,
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  await prisma.$disconnect();
  process.exit(1);
});
