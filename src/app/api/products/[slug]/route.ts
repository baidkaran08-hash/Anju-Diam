import { getProductBySlug, getRelated } from "@/lib/catalogue";
import { fail, ok, route } from "@/lib/api";

export const GET = route(async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);
  if (!product) return fail("No such piece.", 404);

  const related = await getRelated(product);
  return ok({ product, related });
});
