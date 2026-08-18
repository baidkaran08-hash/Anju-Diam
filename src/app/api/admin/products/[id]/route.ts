import { requireAdmin } from "@/lib/auth";
import {
  deleteOrArchiveProduct,
  getProductForEdit,
  replaceProductImages,
  updateProduct,
} from "@/lib/admin-products";
import { productImageOrderSchema, productWriteSchema } from "@/lib/validation";
import { fail, ok, readJson, route } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, context: Ctx) => {
  await requireAdmin();
  const { id } = await context.params;
  const product = await getProductForEdit(id);
  if (!product) return fail("No such piece.", 404);
  return ok({ product });
});

export const PATCH = route(async (request: Request, context: Ctx) => {
  await requireAdmin();
  const { id } = await context.params;

  const existing = await getProductForEdit(id);
  if (!existing) return fail("No such piece.", 404);

  const body = (await readJson(request)) as Record<string, unknown>;

  // The gallery editor sends only `images`; the detail form sends the full
  // record. One route handles both so the client never has to care which
  // endpoint owns which field.
  if (body && typeof body === "object" && "images" in body && Object.keys(body).length === 1) {
    const { images } = productImageOrderSchema.parse(body);
    const product = await replaceProductImages(id, images);
    return ok({ product });
  }

  const input = productWriteSchema.parse(body);
  const product = await updateProduct(id, input);
  return ok({ product });
});

export const DELETE = route(async (_request: Request, context: Ctx) => {
  await requireAdmin();
  const { id } = await context.params;

  const existing = await getProductForEdit(id);
  if (!existing) return fail("No such piece.", 404);

  const result = await deleteOrArchiveProduct(id);
  return ok(result);
});
