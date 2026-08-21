import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MEDIA_DIR, MEDIA_URL_PREFIX } from "@/lib/media";

/**
 * Where uploaded product photography goes.
 *
 * Two backends, chosen by whether a blob token is present:
 *
 *   Vercel — and any host with an ephemeral filesystem — sets
 *   BLOB_READ_WRITE_TOKEN, and files go to Vercel Blob. That is required
 *   there: a file written to disk on Vercel is gone on the next deploy, so a
 *   local write would appear to work right up until launch.
 *
 *   Anywhere with a real disk (a VPS, a volume, your laptop) has no token, and
 *   files go to MEDIA_DIR, served back by /api/media.
 *
 * Callers get a URL and do not care which ran.
 */

export const usingBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function storeImage(
  slug: string,
  filename: string,
  body: Buffer,
): Promise<string> {
  if (usingBlob()) {
    // Imported lazily so a disk-backed deployment never loads the SDK.
    const { put } = await import("@vercel/blob");
    const blob = await put(`products/${slug}/${filename}`, body, {
      access: "public",
      contentType: "image/webp",
      // The filename already carries a random suffix, so Vercel does not need
      // to add a second one — that would make the stored URL unpredictable.
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const dir = path.join(MEDIA_DIR, "products", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), body);
  return `${MEDIA_URL_PREFIX}/products/${slug}/${filename}`;
}
