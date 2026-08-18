/**
 * Seeds the demo database: 250 placeholder pieces, an administrator, and a
 * customer account with a wishlist so the signed-in views are not empty.
 *
 * Idempotent — every write is an upsert keyed on a natural unique field, so
 * running it twice is safe.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { generateCatalogue } from "./catalogue";
import { CATEGORIES } from "../src/lib/enums";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@anjudiam.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "changeme-in-production";
const CUSTOMER_EMAIL = "client@example.com";
const CUSTOMER_PASSWORD = "demo-account-1993";

async function main() {
  // Retire anything left in a discontinued collection — Bridal became Gifting,
  // and a stale row would otherwise keep serving on the storefront. Rows that
  // appear on a past order are archived rather than deleted, because deleting
  // them would orphan the order line.
  const stale = await prisma.product.findMany({
    where: { category: { notIn: [...CATEGORIES] } },
    select: { id: true, category: true },
  });

  if (stale.length > 0) {
    let archived = 0;
    let removed = 0;

    for (const row of stale) {
      const onOrder = await prisma.orderItem.count({ where: { productId: row.id } });
      if (onOrder > 0) {
        await prisma.product.update({
          where: { id: row.id },
          data: { category: "GIFTING", status: "ARCHIVED" },
        });
        archived += 1;
      } else {
        await prisma.product.delete({ where: { id: row.id } });
        removed += 1;
      }
    }
    console.log(`Retired ${stale.length} piece(s) from discontinued collections — ${removed} deleted, ${archived} archived.`);
  }

  const catalogue = generateCatalogue();
  console.log(`Seeding ${catalogue.length} pieces…`);

  for (const product of catalogue) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: product,
      update: product,
    });
  }

  const [admin, customer] = await Promise.all([
    prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      create: {
        email: ADMIN_EMAIL,
        name: "Anju Diam Studio",
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "ADMIN",
      },
      update: { role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: CUSTOMER_EMAIL },
      create: {
        email: CUSTOMER_EMAIL,
        name: "Ayushi Kothari",
        phone: "+66 81 234 5678",
        passwordHash: await bcrypt.hash(CUSTOMER_PASSWORD, 12),
        role: "CUSTOMER",
      },
      update: {},
    }),
  ]);

  // A few saved pieces, so /wishlist and /account are not blank on first look.
  const featured = await prisma.product.findMany({
    where: { isFeatured: true },
    take: 3,
    orderBy: { rank: "asc" },
  });

  for (const product of featured) {
    await prisma.wishlistItem.upsert({
      where: { key_productId: { key: `u:${customer.id}`, productId: product.id } },
      create: { key: `u:${customer.id}`, userId: customer.id, productId: product.id },
      update: {},
    });
  }

  // One worked example in the enquiry queue so the admin view has something in
  // it the first time it is opened.
  const existingEnquiries = await prisma.enquiry.count();
  if (existingEnquiries === 0) {
    await prisma.enquiry.create({
      data: {
        name: "Nalinee Srisai",
        email: "nalinee.s@example.com",
        phone: "+66 89 555 0142",
        kind: "CUSTOM",
        subject: "Engagement ring — oval, illusion setting",
        budget: "฿180,000 – ฿250,000",
        message:
          "I saw an illusion-set oval on your collections page and would like something similar, but in rose gold and a little wider across the finger. Could we discuss sketches?",
        status: "NEW",
      },
    });
  }

  const counts = await prisma.product.groupBy({ by: ["category"], _count: true });

  console.log("\nSeeded:");
  for (const row of counts.sort((a, b) => b._count - a._count)) {
    console.log(`  ${row.category.padEnd(10)} ${row._count}`);
  }
  console.log(`\n  Admin     ${admin.email} / ${ADMIN_PASSWORD}`);
  console.log(`  Customer  ${customer.email} / ${CUSTOMER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
