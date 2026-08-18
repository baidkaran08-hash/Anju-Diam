/**
 * Snapshot the SQLite database.
 *
 * SQLite on a mounted disk is the right call for this site's traffic, but it
 * means the whole catalogue, every enquiry and every order live in one file.
 * That file deserves a copy before anything risky — a schema change, a
 * catalogue import, a plan change on the host.
 *
 *   npm run db:backup            → next to the database
 *   npm run db:backup -- /path   → somewhere else
 *
 * Uses SQLite's own backup via `.backup`, falling back to a file copy, so a
 * snapshot taken while the server is running is still consistent.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Reads DATABASE_URL from the environment, falling back to .env.
 * Run through tsx there is no framework to load .env for us, and silently
 * defaulting to the wrong path is how you take a backup of nothing.
 */
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const env = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    const match = env.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (match) return match[1]!.trim();
  } catch {
    // No .env — fall through to the development default.
  }
  return "file:./dev.db";
}

function databasePath() {
  const url = databaseUrl();
  if (!url.startsWith("file:")) {
    throw new Error(`DATABASE_URL is not a SQLite file (${url}). Use your provider's own backup.`);
  }
  const raw = url.slice("file:".length);
  // Prisma resolves relative file: URLs against prisma/, not the project root.
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), "prisma", raw);
}

function main() {
  const source = databasePath();
  if (!existsSync(source)) throw new Error(`No database at ${source}`);

  const target = process.argv[2] ?? path.join(path.dirname(source), "backups");
  mkdirSync(target, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const destination = path.join(target, `anju-${stamp}.db`);

  try {
    execFileSync("sqlite3", [source, `.backup '${destination}'`], { stdio: "pipe" });
    console.log(`Backed up (sqlite3) → ${destination}`);
  } catch {
    copyFileSync(source, destination);
    console.log(`Backed up (file copy) → ${destination}`);
    console.log("Note: sqlite3 was unavailable, so stop the server before trusting this copy.");
  }
}

main();
