/**
 * Logo asset pipeline.
 *
 * The supplied mark and wordmark carry a soft low-alpha fringe around every
 * stroke — the residue of a background removal. Over ivory it reads as a dirty
 * grey cloud, which is not acceptable on a luxury site.
 *
 * This crushes that fringe with an alpha curve, then rebuilds each colourway by
 * using the cleaned alpha as a mask over a flat brand colour. Working from one
 * master means the three colourways are guaranteed to be the same artwork, and
 * the brand hexes come from the brand sheet rather than from whatever was baked
 * into each file.
 *
 *   npx tsx scripts/build-logo.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const LOGO_DIR = path.join(process.cwd(), "public", "logo");

/** Alpha below LOW is dropped; above HIGH is solid; between is ramped. */
const LOW = 150;
const HIGH = 216;

const COLOURWAYS = {
  plum: "#4F243C",
  ivory: "#F8F5F1",
  gold: "#C8A46A",
} as const;

/**
 * Reads the alpha channel and rescales it so the fringe disappears.
 *
 * Done on raw bytes rather than with sharp's `linear()`, which silently does
 * nothing useful once a channel has been extracted — the alpha profile of the
 * output came back byte-identical to the input.
 */
async function cleanedAlpha(source: string) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  const alpha = Buffer.allocUnsafe(pixels);

  for (let i = 0; i < pixels; i += 1) {
    const value = data[i * 4 + 3]!;
    const scaled = ((value - LOW) / (HIGH - LOW)) * 255;
    alpha[i] = scaled <= 0 ? 0 : scaled >= 255 ? 255 : Math.round(scaled);
  }

  return { alpha, width: info.width, height: info.height };
}

async function build(name: "mark" | "wordmark", scale: number) {
  const master = path.join(LOGO_DIR, "_master", `${name}.webp`);
  const { alpha, width, height } = await cleanedAlpha(master);

  for (const [tone, hex] of Object.entries(COLOURWAYS)) {
    const tinted = await sharp({
      create: { width, height, channels: 3, background: hex },
    })
      .joinChannel(alpha, { raw: { width, height, channels: 1 } })
      .png()
      .toBuffer();

    // Trim the transparent margin so the asset's box is the artwork's box —
    // otherwise every layout has to guess at invisible padding.
    const out = await sharp(tinted)
      .trim({ threshold: 1 })
      .resize({ width: Math.round(width * scale), withoutEnlargement: false })
      .webp({ quality: 95, alphaQuality: 100, effort: 6 })
      .toBuffer();

    await writeFile(path.join(LOGO_DIR, `${name}-${tone}.webp`), out);
    const meta = await sharp(out).metadata();
    console.log(`  ${name}-${tone}.webp  ${meta.width}x${meta.height}  ${(out.length / 1024).toFixed(1)} KB`);
  }
}

/** Favicon: the mark in gold on the house plum. */
async function favicon() {
  const { alpha, width, height } = await cleanedAlpha(path.join(LOGO_DIR, "_master", "mark.webp"));

  const gold = await sharp({ create: { width, height, channels: 3, background: COLOURWAYS.gold } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(gold).trim({ threshold: 1 }).resize(360, 360, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).toBuffer();

  const icon = await sharp({
    create: { width: 512, height: 512, channels: 4, background: COLOURWAYS.plum },
  })
    .composite([{ input: trimmed, gravity: "centre" }])
    .png()
    .toBuffer();

  await mkdir(path.join(process.cwd(), "src", "app"), { recursive: true });
  await writeFile(path.join(process.cwd(), "src", "app", "icon.png"), icon);
  await writeFile(path.join(process.cwd(), "src", "app", "apple-icon.png"), icon);
  console.log("  icon.png / apple-icon.png  512x512");
}

async function main() {
  console.log("Rebuilding logo assets from the plum masters…");
  await build("mark", 1.15);
  await build("wordmark", 1.2);
  await favicon();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
