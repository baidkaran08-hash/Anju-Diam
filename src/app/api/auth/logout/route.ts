import { ok } from "@/lib/api";
import { destroySession } from "@/lib/auth";

/** POST /api/auth/logout */
export async function POST() {
  await destroySession();
  return ok({ message: "Signed out." });
}
