import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { mergeGuestInto } from "@/lib/owner";
import { registerSchema } from "@/lib/validation";
import { fail, ok, readJson, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const POST = route(async (request: Request) => {
  const limit = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return fail("Too many attempts. Please try again later.", 429);

  const input = registerSchema.parse(await readJson(request));

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return fail("Please check the highlighted fields.", 422, {
      fields: { email: "An account already exists for that address." },
    });
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      phone: input.phone || null,
      passwordHash: await hashPassword(input.password),
      role: "CUSTOMER",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // Anything picked out before registering follows the visitor into the account.
  await mergeGuestInto(user.id);
  await createSession({ ...user, role: "CUSTOMER" });

  return ok({ user }, { status: 201 });
});
