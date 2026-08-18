import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok, route } from "@/lib/api";
import { MEDIA_DIR, MEDIA_URL_PREFIX } from "@/lib/media";

/**
 * Product photography upload.
 *
 * Writes to MEDIA_DIR (./media by default), NOT public/. Next builds a static
 * manifest of public/ at build time, so a file written there after the build
 * works in development and 404s in production — the upload would have looked
 * fine right up until launch. Files are served back by /api/media.
 *
 * On an ephemeral filesystem this directory does not survive a deploy. Point
 * MEDIA_DIR at a mounted volume, or swap the two writeFile calls below for an
 * S3 / R2 / Blob put — the database only ever stores the returned URL.
 */

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/tiff"];

/** Long edge for the full-size render. Enough for a full-bleed 4K hero crop. */
const FULL_EDGE = 2600;
/** Grid and thumbnail render, saves the browser downloading the full file. */
const THUMB_EDGE = 900;

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Send the image as multipart form data.", 400);

  const productId = String(form.get("productId") ?? "");
  const file = form.get("file");

  if (!productId) return fail("Which piece is this for?", 400);
  if (!(file instanceof File)) return fail("No file was attached.", 400);
  if (file.size > MAX_BYTES) {
    return fail(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 12 MB.`, 413);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, name: true, images: { select: { id: true } } },
  });
  if (!product) return fail("No such piece.", 404);
  if (product.images.length >= 12) return fail("A piece can hold twelve photographs.", 400);

  const bytes = Buffer.from(await file.arrayBuffer());

  // Trust the decoded pixels, not the declared Content-Type — a browser will
  // happily label anything image/jpeg.
  let meta;
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    return fail("That file is not an image we can read.", 415);
  }
  if (!meta.width || !meta.height) return fail("That file is not an image we can read.", 415);
  if (file.type && !ACCEPTED.includes(file.type)) {
    return fail("Upload a JPEG, PNG, WebP, AVIF or TIFF.", 415);
  }

  const dir = path.join(MEDIA_DIR, "products", product.slug);
  await mkdir(dir, { recursive: true });

  const id = randomUUID().slice(0, 8);
  const base = `${Date.now().toString(36)}-${id}`;

  // `withoutEnlargement` matters: upscaling a small phone snap to 2600px would
  // produce exactly the soft, mushy result this site is trying to avoid.
  const full = await sharp(bytes)
    .rotate()
    .resize(FULL_EDGE, FULL_EDGE, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 88, effort: 5 })
    .toBuffer();

  const thumb = await sharp(bytes)
    .rotate()
    .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  await Promise.all([
    writeFile(path.join(dir, `${base}.webp`), full),
    writeFile(path.join(dir, `${base}-thumb.webp`), thumb),
  ]);

  const url = `${MEDIA_URL_PREFIX}/products/${product.slug}/${base}.webp`;

  const image = await prisma.productImage.create({
    data: {
      productId: product.id,
      url,
      alt: product.name,
      position: product.images.length,
    },
  });

  const output = await sharp(full).metadata();

  return ok(
    {
      image,
      source: { width: meta.width, height: meta.height, bytes: file.size },
      stored: { width: output.width, height: output.height, bytes: full.length },
    },
    { status: 201 },
  );
});
