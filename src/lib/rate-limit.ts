/**
 * Fixed-window rate limiter, in process memory.
 *
 * Enough to stop a script hammering the enquiry form from one address. It is
 * deliberately not distributed: on a multi-instance or serverless deployment
 * each instance keeps its own counter, so the effective limit is
 * `limit x instances`. If the site ever needs a hard guarantee, swap the Map
 * for Upstash Redis — the call signature is designed not to change.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Stops the Map growing without bound on a long-lived server. */
function sweep(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/**
 * Best-effort client address.
 *
 * x-forwarded-for is trivially spoofable when the app is exposed directly, so
 * this is only sound behind a proxy that overwrites the header — which Vercel,
 * Cloudflare and nginx all do by default.
 */
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
