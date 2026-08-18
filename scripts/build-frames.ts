/**
 * Frame pipeline for the scroll-driven hero.
 *
 * Source: 300 JPEG frames, 1920x1080, of a slow push-in on the model against a
 * warm champagne studio backdrop.
 *
 * Two things happen here.
 *
 * 1. The generator's star watermark is painted out of the bottom-right corner.
 *    It sits on a smooth gradient, so each affected row is rebuilt by
 *    interpolating between clean strips either side of it. That reproduces the
 *    gradient exactly — unlike cloning a patch from elsewhere, which leaves a
 *    visible disc wherever the tone does not match, or averaging the
 *    surrounding area, which averages the star's own brightness back in.
 *    Nothing is cropped, so the clean right-hand backdrop the hero copy sits
 *    on is preserved in full.
 *
 * 2. The frame is resampled up with lanczos3 and then unsharp-masked. The
 *    canvas is full-bleed, so on a Retina laptop it is drawn about 3355px
 *    wide; anything narrower than that is upscaled by the browser on every
 *    draw. Doing it once here with a good kernel beats bilinear every frame.
 *
 * This source is full HD — 2.25x the pixels of the original 1280x720 footage
 * and roughly double the bitrate per frame — so the ultra tier is now only a
 * 1.8x upscale rather than 2.7x, and it shows.
 *
 *   npx tsx scripts/build-frames.ts [sourceDir]
 *
 * sourceDir defaults to ./raw-frames — unzip the frame archive into it first.
 */

import { mkdir, readdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = process.argv[2] ?? path.join(process.cwd(), "raw-frames");
const OUT_DIR = path.join(process.cwd(), "public", "frames");

/** The star watermark's bounding box in the 1920x1080 source, with margin. */
const STAR = { x0: 1688, x1: 1796, y0: 843, y1: 955 };
/** Width of the clean strip sampled either side of it. */
const STAR_ANCHOR = 34;
/** Rows eased back toward the original at the top and bottom of the box. */
const STAR_FEATHER = 14;

/**
 * Rebuilds the rows behind the star by interpolating across it.
 * Returns a sharp instance wrapping the repaired raw pixels.
 */
async function despark(file: string) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x: number, y: number) => (y * width + x) * channels;

  for (let y = STAR.y0; y <= STAR.y1; y += 1) {
    for (let c = 0; c < 3; c += 1) {
      let left = 0;
      let right = 0;
      for (let i = 1; i <= STAR_ANCHOR; i += 1) {
        left += data[at(STAR.x0 - i, y) + c]!;
        right += data[at(STAR.x1 + i, y) + c]!;
      }
      left /= STAR_ANCHOR;
      right /= STAR_ANCHOR;

      for (let x = STAR.x0; x <= STAR.x1; x += 1) {
        const t = (x - STAR.x0) / (STAR.x1 - STAR.x0);
        let value = left + (right - left) * t;

        const edge = Math.min(y - STAR.y0, STAR.y1 - y);
        if (edge < STAR_FEATHER) {
          const blend = edge / STAR_FEATHER;
          value = data[at(x, y) + c]! * (1 - blend) + value * blend;
        }
        data[at(x, y) + c] = Math.round(value);
      }
    }
  }

  return sharp(data, { raw: { width, height, channels } });
}

/**
 * Three tiers, chosen by viewport *and* device pixel ratio.
 *
 * `ultra` exists because of how big the canvas actually gets. A 1440pt Retina
 * laptop at DPR 2 builds a 2880x1800 canvas, and because the frame is wider
 * than the viewport the cover fit scales by height — so the frame is drawn
 * about 3355px wide. Anything narrower than that is being upscaled on every
 * single draw. At 3456 the source finally exceeds the canvas and the browser
 * downsamples instead, which is the sharpest a raster can look.
 *
 * A previous revision capped DPR at 1.75 to save fill rate. On a Retina screen
 * that is directly visible as blur, and it was the single largest contributor
 * to the sequence looking soft. Quality wins; the cap is back at 2.
 */
// Qualities were checked against the source at true 1:1 on the necklace: 80 and
// 72 are indistinguishable, 65 starts mottling skin tones. 72 it is — it saves
// roughly 8 MB across the ultra set for nothing a viewer can see.
const VARIANTS = [
  { name: "ultra", width: 3456, quality: 72, sharpen: 1.1 },
  { name: "desktop", width: 2304, quality: 78, sharpen: 0.9 },
  { name: "mobile", width: 1152, quality: 78, sharpen: 0.6 },
] as const;

async function main() {
  const entries = (await readdir(SOURCE_DIR))
    .filter((name) => /\.(jpe?g|png)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (entries.length === 0) {
    throw new Error(
      `No frames found in ${SOURCE_DIR}. Unzip AnjuDiam1.zip into that folder first.`,
    );
  }

  const meta = await sharp(path.join(SOURCE_DIR, entries[0]!)).metadata();
  const srcW = meta.width!;
  const srcH = meta.height!;

  console.log(`${entries.length} frames · ${srcW}x${srcH} · watermark painted out, no crop`);

  for (const variant of VARIANTS) {
    await rm(path.join(OUT_DIR, variant.name), { recursive: true, force: true });
    await mkdir(path.join(OUT_DIR, variant.name), { recursive: true });
  }

  const sizes: Record<string, number> = {};

  for (const [index, name] of entries.entries()) {
    const src = path.join(SOURCE_DIR, name);
    const frameNo = String(index + 1).padStart(4, "0");

    // The watermark repair is done once per frame, then reused for all tiers.
    const repaired = await (await despark(src)).png().toBuffer();

    for (const variant of VARIANTS) {
      const height = Math.round((srcH / srcW) * variant.width);

      const buffer = await sharp(repaired)
        .resize(variant.width, height, { kernel: "lanczos3" })
        // m1 keeps flat areas (skin, the backdrop) from picking up grain;
        // m2 lets genuine edges — stone facets, the chain — take the gain.
        .sharpen({ sigma: variant.sharpen, m1: 0.5, m2: 2.2 })
        .webp({ quality: variant.quality, effort: 6, smartSubsample: true })
        .toBuffer();

      await writeFile(path.join(OUT_DIR, variant.name, `frame-${frameNo}.webp`), buffer);
      sizes[variant.name] = (sizes[variant.name] ?? 0) + buffer.length;
    }

    if ((index + 1) % 40 === 0) console.log(`  ${index + 1}/${entries.length}`);
  }

  // A blurred first frame, inlined as a data URI, paints instantly behind the
  // canvas so the hero is never a black rectangle on a cold load.
  const posterBuffer = await (await despark(path.join(SOURCE_DIR, entries[0]!)))
    .resize(32)
    .blur(1.2)
    .webp({ quality: 40 })
    .toBuffer();

  const manifest = {
    source: `${entries.length} frames, ${srcW}x${srcH} JPEG`,
    pipeline: "star watermark painted out by row interpolation · lanczos3 resample · unsharp mask · WebP",
    aspectRatio: Number((srcW / srcH).toFixed(4)),
    /** Average backdrop tone, used as the canvas ground so letterboxing blends. */
    backdrop: "#A48769",
    frameCount: entries.length,
    pad: 4,
    format: "webp",
    poster: `data:image/webp;base64,${posterBuffer.toString("base64")}`,
    variants: VARIANTS.map((variant) => ({
      name: variant.name,
      width: variant.width,
      height: Math.round((srcH / srcW) * variant.width),
      quality: variant.quality,
      totalMB: Number(((sizes[variant.name] ?? 0) / 1024 / 1024).toFixed(2)),
    })),
  };

  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\nDone.");
  for (const variant of manifest.variants) {
    console.log(
      `  ${variant.name.padEnd(8)} ${variant.width}x${variant.height}  ${variant.totalMB} MB  (${Math.round((variant.totalMB * 1024) / entries.length)} KB/frame)`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
