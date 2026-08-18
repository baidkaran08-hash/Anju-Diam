import { listProducts } from "@/lib/catalogue";
import { ok, route, searchParamsToObject } from "@/lib/api";

export const GET = route(async (request: Request) => {
  const result = await listProducts(searchParamsToObject(request.url));
  return ok(result);
});
