import { prisma } from "@/lib/prisma";
import { ok, fail, fromZod } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSession } from "@/lib/auth";

/** POST /api/auth/login */
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  // Same message either way — do not reveal which accounts exist.
  const invalid = fail("That email and password do not match.", 401);
  if (!user) return invalid;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return invalid;

  await createSession({ userId: user.id, role: user.role });
  return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
