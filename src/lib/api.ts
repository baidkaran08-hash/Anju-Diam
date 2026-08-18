import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError } from "@/lib/auth";
import { fieldErrors } from "@/lib/validation";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Wraps a route handler so the three failure modes every route shares —
 * invalid input, not signed in, everything else — are handled in one place
 * instead of being re-implemented per file.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return fail("Please check the highlighted fields.", 422, { fields: fieldErrors(error) });
      }
      if (error instanceof AuthError) {
        return fail(error.message, error.status);
      }
      console.error("[api] unhandled error:", error);
      return fail("Something went wrong at our end. Please try again.", 500);
    }
  };
}

/** Reads a JSON body, tolerating an empty one. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function searchParamsToObject(url: string) {
  const params = new URL(url).searchParams;
  const out: Record<string, string> = {};
  for (const [key, value] of params) {
    if (value !== "") out[key] = value;
  }
  return out;
}
