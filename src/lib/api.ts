import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Turns a Zod failure into a field-keyed map the form can render inline. */
export function fromZod(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fail("Check the highlighted fields.", 422, { fields });
}
