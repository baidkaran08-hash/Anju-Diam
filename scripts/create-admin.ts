/**
 * Create or update a studio account.
 *
 *   read -rs "PW?Password: " && ADMIN_PASSWORD="$PW" ADMIN_EMAIL="info@anjudiam.com" \
 *     npm run admin:create && unset PW
 *
 * Separate from `npm run db:seed`, which is the right tool for standing up a
 * demo and the wrong one for a live database: alongside the administrator it
 * inserts a customer whose password is printed in the README, three wishlist
 * rows belonging to that customer, and a fictional enquiry. None of that
 * should exist in a database the house is actually trading on.
 *
 * The password is read from the environment rather than from an argument, so
 * it does not land in shell history or in the output of `ps`.
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Long enough that a leaked hash is not worth the electricity. */
const MIN_LENGTH = 12;

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "Anju Diam Studio").trim();

  if (!email || !email.includes("@")) {
    console.error(
      "\nSet ADMIN_EMAIL to the address this account signs in with.\n\n" +
        '  read -rs "PW?Password: " && ADMIN_PASSWORD="$PW" ADMIN_EMAIL="info@anjudiam.com" \\\n' +
        "    npm run admin:create && unset PW\n",
    );
    process.exit(1);
  }

  if (password.length < MIN_LENGTH) {
    console.error(
      `\nADMIN_PASSWORD must be at least ${MIN_LENGTH} characters. ` +
        "This account can edit every price and read every customer address.\n",
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    // An existing account has its password reset and is promoted, which is
    // what someone running this against a forgotten login actually wants.
    update: { passwordHash, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" },
  });

  const admins = await prisma.user.count({ where: { role: "ADMIN" } });

  console.log(`\n${existing ? "Updated" : "Created"} studio account: ${user.email}`);
  console.log(`Administrators on this database: ${admins}`);
  console.log("\nSign in at /admin. Nothing else was written — no demo customer,");
  console.log("no sample enquiry, no placeholder catalogue.\n");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  await prisma.$disconnect();
  process.exit(1);
});
