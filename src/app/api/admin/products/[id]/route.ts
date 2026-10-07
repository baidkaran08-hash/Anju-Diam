import { requireAdmin } from "@/lib/auth";
import {
  deleteOrArchiveProduct,
  getProductForEdit,
  replaceCertificates,
  replaceProductImages,
  replaceProductVariants,
  updateProduct,
} from "@/lib/admin-products";
import {
  certificatesSchema,
  productImageOrderSchema,
  productVariantsSchema,
  productWriteSchema,
} from "@/lib/validation";
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

  // Each sub-editor — gallery, options, reports — PATCHes only its own key,
  // while the detail form sends the whole record. One route handles all four so
  // the client never has to care which endpoint owns which field. The
  // single-key test is what separates them: a full save always carries `name`
  // and friends alongside, and must fall through to the product schema.
  if (body && typeof body === "object" && Object.keys(body).length === 1) {
    if ("images" in body) {
      const { images } = productImageOrderSchema.parse(body);
      return ok({ product: await replaceProductImages(id, images) });
    }

    if ("variants" in body) {
      const { variants } = productVariantsSchema.parse(body);
      return ok({ product: await replaceProductVariants(id, variants) });
    }

    if ("certificates" in body) {
      const { certificates } = certificatesSchema.parse(body);
      return ok({ product: await replaceCertificates(id, certificates) });
    }
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
