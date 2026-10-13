import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { fail, ok, readJson, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(200),
  newPassword: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(200, "That password is too long."),
});

/**
 * Lets a signed-in studio account change its own password.
 *
 * The current password is required even though the person is signed in: a
 * stolen session cookie should not be enough to lock the real owner out.
 */
export const POST = route(async (request: Request) => {
  const admin = await requireAdmin();

  const limit = rateLimit(`password:${admin.id}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return fail("Too many attempts. Please try again shortly.", 429);

  const input = schema.parse(await readJson(request));

  const user = await prisma.user.findUnique({ where: { id: admin.id } });
  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    return fail("Your current password is not right.", 422, {
      fields: { currentPassword: "Your current password is not right." },
    });
  }

  if (input.newPassword === input.currentPassword) {
    return fail("Choose a password different from the current one.", 422, {
      fields: { newPassword: "Choose a password different from the current one." },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });

  return ok({ changed: true });
});
