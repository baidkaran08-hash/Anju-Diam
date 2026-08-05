import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

/** GET /api/products/:slug — one piece, plus three from the same category. */
export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || product.status !== "ACTIVE") {
    return fail("That piece is no longer available.", 404);
  }

  const related = await prisma.product.findMany({
    where: { category: product.category, status: "ACTIVE", NOT: { id: product.id } },
    take: 3,
    orderBy: { isFeatured: "desc" },
  });

  return ok({ product, related });
}
