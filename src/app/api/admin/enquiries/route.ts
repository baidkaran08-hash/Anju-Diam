import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/enquiries?status=NEW — the team's lead inbox. */
export async function GET(request: Request) {
  if (!(await requireAdmin())) return fail("Not authorised.", 403);

  const status = new URL(request.url).searchParams.get("status");
  const valid = ["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"] as const;
  const filter = valid.includes(status as never) ? (status as (typeof valid)[number]) : undefined;

  const enquiries = await prisma.enquiry.findMany({
    where: filter ? { status: filter } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok({ enquiries });
}

/** PATCH /api/admin/enquiries — move a lead through the pipeline. */
export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return fail("Not authorised.", 403);

  const { id, status } = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: "NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  };
  if (!id || !status) return fail("id and status are required.");

  const enquiry = await prisma.enquiry.update({ where: { id }, data: { status } });
  return ok({ enquiry });
}
