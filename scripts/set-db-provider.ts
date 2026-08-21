/**
 * Swap the Prisma datasource provider.
 *
 *   npm run db:local   -> sqlite,     for working on this machine
 *   npm run db:cloud   -> postgresql, what production runs
 *
 * Prisma cannot take the provider from an environment variable, so the line
 * has to be rewritten. That would normally be a footgun — commit the local
 * setting by accident and production breaks — so `vercel-build` forces
 * postgresql before it generates anything. A stray sqlite provider in a commit
 * therefore cannot reach the deployed site.
 *
 * The models are provider-agnostic (no native enums, no scalar lists), so
 * nothing else in the schema changes either way.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROVIDERS = ["sqlite", "postgresql"] as const;
type Provider = (typeof PROVIDERS)[number];

const requested = process.argv[2];

if (!requested || !PROVIDERS.includes(requested as Provider)) {
  console.error(`Usage: tsx scripts/set-db-provider.ts <${PROVIDERS.join("|")}>`);
  process.exit(1);
}

const provider = requested as Provider;
const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

const current = schema.match(/datasource\s+db\s*\{[^}]*?provider\s*=\s*"([^"]+)"/s)?.[1];
if (!current) {
  console.error(`Could not find the datasource provider in ${schemaPath}`);
  process.exit(1);
}

if (current === provider) {
  console.log(`Provider already ${provider}.`);
  process.exit(0);
}

// Scoped to the datasource block so a "provider" inside the generator block is
// never touched.
const updated = schema.replace(
  /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")[^"]+(")/,
  `$1${provider}$2`,
);

writeFileSync(schemaPath, updated);
console.log(`Provider ${current} -> ${provider}.`);

if (provider === "sqlite") {
  console.log('Set DATABASE_URL="file:./dev.db" in .env for local work.');
  console.log("Production is unaffected: vercel-build forces postgresql.");
}
