import "server-only";

import type { Sql } from "postgres";
import { db } from "@/lib/db";

/**
 * The admin side's handle on the database.
 *
 * The public site treats a missing or sleeping database as a cache miss
 * (see `tryDb` in src/lib/db.ts). The admin panel cannot: a save that
 * silently did nothing is worse than an error, so admin code asks for the
 * client through here and lets failures surface.
 */
export class DatabaseUnavailableError extends Error {
  constructor() {
    super("The database is not configured. Set DATABASE_URL and run `npm run db:migrate`.");
    this.name = "DatabaseUnavailableError";
  }
}

export function requireSql(): Sql {
  const sql = db();
  if (!sql) throw new DatabaseUnavailableError();
  return sql;
}

/** Postgres' unique-violation code, and which constraint raised it. */
export function uniqueViolation(err: unknown): string | null {
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23505") {
    return (err as { constraint_name?: string }).constraint_name ?? "";
  }
  return null;
}
