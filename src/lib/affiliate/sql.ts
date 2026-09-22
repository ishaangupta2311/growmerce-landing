import "server-only";

import type { Sql } from "postgres";

import { db } from "@/lib/db";

/**
 * The two things every affiliate query needs, in one place because both
 * `store.ts` (a partner's own data) and `admin-store.ts` (everybody's) depend
 * on them and neither should own the other.
 */

/**
 * The database, or a refusal to pretend.
 *
 * **This deliberately breaks the rule in `src/lib/db.ts`.** Everywhere else in
 * this codebase a database failure is a cache miss: `tryDb` swallows it and the
 * visitor gets their preview anyway, because a marketing funnel must not be
 * held shut by a sleeping Supabase project. None of that applies here. A
 * dashboard that answers "your balance is $0" when it means "I could not reach
 * the database" is not degraded, it is lying about money, and the partner's
 * next action is a support email rather than a refresh. So every affiliate
 * query throws, and `/affiliates/error.tsx` says so plainly.
 */
export function sql(): Sql {
  const client = db();
  if (!client) {
    throw new Error(
      "DATABASE_URL is not set — the affiliate dashboard has no store to read. " +
        "Unlike the marketing pages, it cannot fall back to a cache.",
    );
  }
  return client;
}

/**
 * A count or an amount, as a number.
 *
 * **postgres.js returns `int8` and `numeric` as strings** — it only parses the
 * OIDs that certainly fit in a double — and every id, every `count(*)` and
 * every `sum()` in this schema is one of those. So a raw row's `amount_cents`
 * is `"1999"`, and `a + b` on two of them is `"19991999"`: a wrong number that
 * renders without complaint.
 *
 * This is the only way a value from those columns is allowed to become a
 * number. Cents fit in a double until roughly ninety trillion dollars, so the
 * conversion is safe and the string is only ever a hazard.
 */
export function int(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * A `jsonb` column, as an object.
 *
 * postgres.js parses `jsonb` on the way out, so an `affiliate.event.payload`
 * arrives as the object it was stored as. This exists because the column is
 * `unknown` at the query boundary and something has to say what it is;
 * anything that is not an object comes back empty rather than guessed at.
 *
 * It used to parse strings too, to cope with rows written double-encoded:
 * `${JSON.stringify(event)}::jsonb` binds a *string* to a jsonb parameter,
 * which postgres.js JSON-encodes again, storing a jsonb string around the
 * object — and `payload->>'anything'` was null on every row. `ingest` now
 * binds the object with `sql.json()`, `0007_affiliate_event_payload.sql`
 * unwrapped what had been written and added a check constraint that refuses
 * anything but an object, so the string branch would be dead code that once
 * hid a bug.
 */
export function json(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
