import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MEDIA_DIR, MEDIA_URL_PREFIX } from "@/lib/media";

/**
 * Where uploaded product photography and grading reports go.
 *
 * Three backends, chosen by which environment variables are present. The order
 * matters: the most explicit configuration wins, and the local disk is the
 * fallback of last resort because it is the one that silently stops working
 * when the site is deployed.
 *
 *   1. S3-compatible  — S3_BUCKET and friends. Cloudflare R2, Backblaze B2,
 *      Wasabi, MinIO, or AWS itself. This is the one to reach for: R2's free
 *      tier is 10 GB with no charge for serving the files, which at roughly
 *      half a megabyte per processed photograph is about twenty thousand of
 *      them.
 *
 *   2. Vercel Blob    — BLOB_READ_WRITE_TOKEN, injected automatically when
 *      Blob storage is added to a Vercel project. Nothing to configure, but a
 *      tighter free allowance.
 *
 *   3. Local disk     — MEDIA_DIR, served back by /api/media. Correct on a
 *      laptop or a VPS with a real volume. On Vercel, Fly, or any container
 *      host the directory is wiped on every deploy: the upload appears to work
 *      and the photograph is gone by the next release. `storageBackend()` is
 *      what the upload routes report so this is visible before launch rather
 *      than after.
 *
 * Callers get a URL back and do not care which one ran.
 */

export type StorageBackend = "s3" | "vercel-blob" | "disk";

const s3Config = () => {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    bucket,
    accessKeyId,
    secretAccessKey,
    // R2 and Backblaze need an explicit endpoint; AWS infers one from region.
    endpoint: process.env.S3_ENDPOINT || undefined,
    // R2 ignores region but the SDK insists on one being set.
    region: process.env.S3_REGION || "auto",
    /**
     * Where the files are read from. A bucket is not public by default, so
     * this is the CDN or r2.dev domain bound to it. Without it the stored URL
     * would point at an endpoint that answers 403 to a customer's browser.
     */
    publicUrl: (process.env.S3_PUBLIC_URL || "").replace(/\/$/, ""),
  };
};

export function storageBackend(): StorageBackend {
  if (s3Config()) return "s3";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  return "disk";
}

/** Kept for the upload routes that already report which backend ran. */
export const usingBlob = () => storageBackend() === "vercel-blob";

/**
 * True when uploads will not survive a deploy. The studio surfaces this rather
 * than letting the house discover it the first time a release wipes a month of
 * photography.
 */
export const storageIsEphemeral = () =>
  storageBackend() === "disk" && Boolean(process.env.VERCEL || process.env.FLY_APP_NAME);

/**
 * Writes one file under a piece's folder and returns the URL to read it back.
 *
 * `folder` separates photography from grading reports, which matters when
 * someone is looking through the bucket by hand trying to work out what a file
 * is.
 */
export async function storeFile(
  slug: string,
  filename: string,
  body: Buffer,
  contentType: string,
  folder: "products" | "certificates" = "products",
): Promise<string> {
  const key = `${folder}/${slug}/${filename}`;
  const s3 = s3Config();

  if (s3) {
    // Imported lazily so a deployment on another backend never loads the SDK.
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // The filename already carries a timestamp and a random suffix, so the
        // object is immutable once written and can be cached indefinitely.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    // Falling back to /api/media keeps a misconfigured S3_PUBLIC_URL from
    // writing an unreachable absolute URL into the database, where it would
    // outlive the misconfiguration.
    return s3.publicUrl ? `${s3.publicUrl}/${key}` : `${MEDIA_URL_PREFIX}/${key}`;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, body, {
      access: "public",
      contentType,
      // The filename already carries a random suffix, so Vercel does not need
      // to add a second one — that would make the stored URL unpredictable.
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const dir = path.join(MEDIA_DIR, folder, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), body);
  return `${MEDIA_URL_PREFIX}/${key}`;
}

/** Product photography. Always WebP by the time it reaches here. */
export async function storeImage(slug: string, filename: string, body: Buffer): Promise<string> {
  return storeFile(slug, filename, body, "image/webp", "products");
}
