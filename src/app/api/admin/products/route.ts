import { requireAdmin } from "@/lib/auth";
import { createProduct, listProductsForAdmin } from "@/lib/admin-products";
import { productWriteSchema } from "@/lib/validation";
import { ok, readJson, route, searchParamsToObject } from "@/lib/api";

export const GET = route(async (request: Request) => {
  await requireAdmin();
  const params = searchParamsToObject(request.url);

  const result = await listProductsForAdmin({
    q: params.q,
    category: params.category,
    status: params.status,
    page: params.page ? Number(params.page) : 1,
    perPage: params.perPage ? Number(params.perPage) : 25,
  });

  return ok(result);
});

export const POST = route(async (request: Request) => {
  await requireAdmin();
  const input = productWriteSchema.parse(await readJson(request));
  const product = await createProduct(input);
  return ok({ product }, { status: 201 });
});
