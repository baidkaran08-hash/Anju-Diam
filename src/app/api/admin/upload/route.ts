import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok, route } from "@/lib/api";
import { storeImage, usingBlob } from "@/lib/storage";

/**
 * Product photography upload.
 *
 * Storage backend is chosen in src/lib/storage.ts: Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set, otherwise MEDIA_DIR on a real disk. Never
 * public/ — Next builds a static manifest of that directory at build time, so
 * a file written there afterwards works in development and 404s in production.
 *
 * The database only ever stores the returned URL, so nothing downstream knows
 * or cares which backend ran.
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

  const [url] = await Promise.all([
    storeImage(product.slug, `${base}.webp`, full),
    storeImage(product.slug, `${base}-thumb.webp`, thumb),
  ]);

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
      stored: {
        width: output.width,
        height: output.height,
        bytes: full.length,
        backend: usingBlob() ? "vercel-blob" : "disk",
      },
    },
    { status: 201 },
  );
});
