/**
 * Applies the SQL files in migrations/ to DATABASE_URL, in name order.
 *
 *   npm run db:migrate                       every file
 *   npm run db:migrate -- 0006_blog.sql      just the named ones
 *
 * Every migration in this repo is written to be re-runnable (`if not exists`
 * throughout), so there is no bookkeeping table: running the whole folder
 * against a database that already has most of it is a no-op for those parts.
 * Keep new migrations that way.
 *
 * Reads `.env.local` and `.env` when they exist, as `next dev` does.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

/* The two files `next dev` reads, with its precedence: `.env.local` beats
   `.env`, and the real environment beats both. `loadEnvFile` never overwrites
   a variable that is already set, so loading the more specific file first is
   what produces that order. */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* Absent — the other file or the environment may still have it. */
  }
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set. Put it in .env, .env.local or the environment.");
  process.exit(1);
}

const dir = path.join(process.cwd(), "migrations");
const requested = process.argv.slice(2);
const files = (requested.length > 0 ? requested : readdirSync(dir).filter((f) => f.endsWith(".sql")))
  .map((f) => path.basename(f))
  .sort();

async function main(databaseUrl: string) {
  const sql = postgres(databaseUrl, { prepare: false, max: 1, onnotice: () => {} });
  try {
    for (const file of files) {
      const text = readFileSync(path.join(dir, file), "utf8");
      /* No parameters, so postgres.js uses the simple query protocol, which is
         the one that accepts a whole file of statements at once. */
      await sql.unsafe(text);
      console.log(`applied ${file}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main(url);
