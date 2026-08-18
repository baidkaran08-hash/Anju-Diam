import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validation";
import { ok, readJson, route } from "@/lib/api";

export const GET = route(async () => {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: { include: { product: { select: { name: true, slug: true } } } } },
  });
  return ok({ orders });
});

export const PATCH = route(async (request: Request) => {
  await requireAdmin();
  const input = orderStatusSchema.parse(await readJson(request));
  const order = await prisma.order.update({
    where: { id: input.id },
    data: { status: input.status },
  });
  return ok({ order });
});
