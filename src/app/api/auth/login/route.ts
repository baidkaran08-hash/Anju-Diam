import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { mergeGuestInto } from "@/lib/owner";
import { loginSchema } from "@/lib/validation";
import { fail, ok, readJson, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Role } from "@/lib/enums";

export const POST = route(async (request: Request) => {
  const limit = rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return fail("Too many attempts. Please try again shortly.", 429);

  const input = loginSchema.parse(await readJson(request));
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same message and roughly the same work either way, so the response does not
  // reveal whether an address is registered.
  const valid = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !valid) return fail("Those details do not match an account.", 401);

  await mergeGuestInto(user.id);
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});
