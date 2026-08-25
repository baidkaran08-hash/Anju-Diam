import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { contentTypeFor, resolveMediaPath } from "@/lib/media";

/**
 * Serves uploaded product photography.
 *
 * Uploaded filenames carry a random suffix and the record is immutable once
 * written — a replacement gets a new name — so these can be cached hard.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;

  const filePath = resolveMediaPath(segments);
  if (!filePath) return new Response("Not found", { status: 404 });

  const contentType = contentTypeFor(filePath);
  if (!contentType) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    // Streamed rather than buffered, so a 4000px master does not sit in memory
    // once per concurrent request.
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
