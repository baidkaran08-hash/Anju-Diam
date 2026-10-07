import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok, route } from "@/lib/api";
import { storeFile, storageBackend } from "@/lib/storage";

/**
 * Grading report upload.
 *
 * Separate from the photography route because the two want opposite handling:
 * a photograph is re-encoded to WebP and resized, whereas a GIA report is a
 * legal document and must come back byte-identical to what was filed. Trying
 * to serve both from one handler meant a branch on every line of it.
 *
 * A scan arriving as JPEG or PNG is still converted — those are photographs of
 * a document, not the document — but a PDF is written through untouched.
 */

const MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/tiff"];

/** Long edge for a scanned report. Enough to read the fine print when zoomed. */
const SCAN_EDGE = 2400;

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Send the report as multipart form data.", 400);

  const productId = String(form.get("productId") ?? "");
  const file = form.get("file");

  if (!productId) return fail("Which piece is this report for?", 400);
  if (!(file instanceof File)) return fail("No file was attached.", 400);
  if (file.size > MAX_BYTES) {
    return fail(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 15 MB.`, 413);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) return fail("No such piece.", 404);

  const bytes = Buffer.from(await file.arrayBuffer());
  const base = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

  // Sniff the bytes rather than believing Content-Type, which a browser will
  // set from the file extension alone.
  const isPdf = bytes.subarray(0, 5).toString("latin1") === "%PDF-";

  if (isPdf) {
    const url = await storeFile(product.slug, `${base}.pdf`, bytes, "application/pdf", "certificates");
    return ok(
      { url, kind: "pdf" as const, bytes: bytes.length, backend: storageBackend() },
      { status: 201 },
    );
  }

  if (file.type && !IMAGE_TYPES.includes(file.type)) {
    return fail("Upload the report as a PDF, or a JPEG/PNG scan of it.", 415);
  }

  let scan: Buffer;
  try {
    scan = await sharp(bytes)
      .rotate()
      .resize(SCAN_EDGE, SCAN_EDGE, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
      // Higher quality than the product grid uses: this is text, and WebP at 82
      // turns small serif print to mush.
      .webp({ quality: 92, effort: 5 })
      .toBuffer();
  } catch {
    return fail("That file is neither a PDF nor an image we can read.", 415);
  }

  const url = await storeFile(product.slug, `${base}.webp`, scan, "image/webp", "certificates");

  return ok(
    { url, kind: "image" as const, bytes: scan.length, backend: storageBackend() },
    { status: 201 },
  );
});
