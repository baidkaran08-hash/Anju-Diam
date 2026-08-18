/**
 * First-boot preparation, run before the server starts in production.
 *
 * On a host with a persistent disk the database lives on that disk, which is
 * mounted at run time rather than at build time — so the schema cannot be
 * pushed during the build. This runs at start instead, and is safe to run on
 * every boot:
 *
 *   1. `prisma db push` brings the database up to the current schema. It is a
 *      no-op when they already match.
 *   2. The catalogue is seeded ONLY when the database is empty. This is the
 *      important guard: the seed writes 250 placeholder pieces, and running it
 *      unconditionally would resurrect them over the client's real catalogue
 *      on every single deploy.
 */

import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("[prepare] syncing database schema…");
  // No --accept-data-loss: without it Prisma refuses rather than dropping a
  // column, which is the behaviour you want on a database holding real orders.
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

  const prisma = new PrismaClient();

  try {
    const products = await prisma.product.count();

    if (products > 0) {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      console.log(`[prepare] ${products} pieces already present — skipping seed.`);
      if (admins === 0) {
        console.warn("[prepare] WARNING: no administrator account exists. Create one to reach /admin.");
      }
      return;
    }

    console.log("[prepare] empty database — seeding the placeholder catalogue…");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[prepare] failed:", error);
  process.exit(1);
});
