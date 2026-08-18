import { prisma } from "@/lib/prisma";

/**
 * Health check for the host's monitor.
 *
 * Touches the database rather than just returning 200 — a process that is up
 * but cannot read its own catalogue is not healthy, and a check that ignores
 * that will happily keep a broken deploy in service.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.count({ where: { status: "ACTIVE" } });
    return Response.json({ ok: true, products }, { status: 200 });
  } catch (error) {
    console.error("[health] database unreachable:", error);
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
}
