import { prisma } from "@/lib/prisma";
import { ok, fail, fromZod } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { hashPassword, createSession } from "@/lib/auth";

/** POST /api/auth/register */
export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return fail("An account already exists for that email. Sign in instead.", 409);
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      cart: { create: {} },
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await createSession({ userId: user.id, role: user.role });
  return ok({ user }, 201);
}
