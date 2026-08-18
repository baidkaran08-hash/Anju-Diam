import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enquiryStatusSchema } from "@/lib/validation";
import { ok, readJson, route } from "@/lib/api";

export const GET = route(async () => {
  await requireAdmin();
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return ok({ enquiries });
});

export const PATCH = route(async (request: Request) => {
  await requireAdmin();
  const input = enquiryStatusSchema.parse(await readJson(request));
  const enquiry = await prisma.enquiry.update({
    where: { id: input.id },
    data: { status: input.status },
  });
  return ok({ enquiry });
});
