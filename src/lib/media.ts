import "server-only";

import path from "node:path";

/**
 * Where uploaded product photography lives.
 *
 * Deliberately NOT public/. Next builds a static manifest of public/ at build
 * time, so anything written there afterwards is served in development and
 * silently 404s in production — which would have made the studio's image
 * upload look like it worked right up until the site went live.
 *
 * Files are written here and served by src/app/api/media/[...path]/route.ts.
 *
 * On an ephemeral filesystem (Vercel, Fly, most containers) this directory does
 * not survive a deploy. Point MEDIA_DIR at a mounted volume, or swap the two
 * writeFile calls in the upload route for an S3 / R2 / Blob put — the database
 * only ever stores the URL, so nothing else changes.
 */
export const MEDIA_DIR = process.env.MEDIA_DIR
  ? path.resolve(process.env.MEDIA_DIR)
  : path.join(process.cwd(), "media");

export const MEDIA_URL_PREFIX = "/api/media";

/**
 * Resolves a request path to a file inside MEDIA_DIR, or null.
 *
 * Returning null for anything that escapes the directory is the whole point:
 * without it, `/api/media/../../.env` would read the environment file.
 */
export function resolveMediaPath(segments: string[]): string | null {
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;

  const joined = path.join(MEDIA_DIR, ...segments);
  const resolved = path.resolve(joined);

  // path.relative is the reliable check — a plain startsWith would accept
  // a sibling directory whose name merely begins with MEDIA_DIR.
  const relative = path.relative(MEDIA_DIR, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;

  return resolved;
}

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

export function contentTypeFor(filePath: string) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? null;
}
