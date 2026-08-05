import { ok } from "@/lib/api";
import { currentUser } from "@/lib/auth";

/** GET /api/auth/me — null when signed out, never a 401, so the header can render either way. */
export async function GET() {
  return ok({ user: await currentUser() });
}
