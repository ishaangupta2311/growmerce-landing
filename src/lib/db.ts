/**
 * The one connection to Supabase, and the rule that governs every use of it.
 *
 * **The database is never allowed to break the site.** Every caller here treats
 * a failure as a cache miss, not an error: a preview that cannot be read from
 * Postgres is rebuilt, and a lead that cannot be written is logged and the
 * visitor still gets their preview. This is not defensive habit, it is the
 * shape of the thing we bought — Supabase pauses a free project after about a
 * week of inactivity, so "the database is asleep" is a *routine* state for a
 * marketing site that goes quiet over a holiday, not an incident. A quiet week
 * must cost us a cache, never the funnel.
 *
 * Serverless connection handling is the other half. Each invocation gets its
 * own process, so a pool per instance multiplied by concurrent invocations is
 * how you exhaust a Postgres connection limit; the URL therefore has to be
 * Supabase's Supavisor pooler (port 6543, transaction mode), which multiplexes
 * them. Transaction mode cannot hold a prepared statement across statements,
 * hence `prepare: false` — with it left on, queries fail only under
 * concurrency, which is the worst way to find out.
 */

import postgres, { type Options, type ReservedSql, type Sql } from "postgres";

/* postgres.js honours `max_pipeline` at runtime but leaves it out of its
   type definitions (src/index.js lists it with the other integer options). */
type ClientOptions = Options<Record<string, never>> & { max_pipeline?: number };

/** How long a stored preview stays good before we rebuild it. */
export const PREVIEW_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A preview with no screenshot and default colours is a placeholder, not an
 * answer, and pinning one for a week would strand a store that was briefly
 * behind a challenge page. Mirrors the same idea in the in-memory cache.
 */
export const DEGRADED_TTL_MS = 30 * 60 * 1000;

let client: Sql | null = null;
let warned = false;

/**
 * The client, or null when no `DATABASE_URL` is configured.
 *
 * Null is a supported mode, not a broken one: local development and the
 * preview deployments run fine without a database, falling back to the
 * in-process and tmpdir caches. Returning null rather than throwing is what
 * lets every caller share the "treat it as a miss" path.
 */
export function db(): Sql | null {
  if (client) return client;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    if (!warned) {
      warned = true;
      console.info("[db] DATABASE_URL is not set — previews and leads will not be persisted.");
    }
    return null;
  }

  const options: ClientOptions = {
    /* Supavisor's transaction mode hands a different backend to each
       statement, so a prepared statement from an earlier one is not there. */
    prepare: false,
    /* Never send a second query down a connection before the first has
       answered. postgres.js pipelines by default once there are more
       concurrent queries than connections, and Supavisor's transaction mode
       does not survive it: the pooled backend is left half-way through a
       message, the connection never answers again, and once every connection
       is wedged each query queues forever. Reproduced against this project
       with real queries — five in parallel on a pool of three hangs on the
       second round, eight on a pool of one hangs on the first — and with this
       at zero the same loads complete every time.

       Widening the pool does not fix it, it moves it: a pool of three hung
       at five, a pool of one at eight, and where a pool of ten turns is a
       matter of timing rather than a number to design around. Zero is what
       makes a page's fan-out width irrelevant to correctness.

       It has one cost. In postgres.js `execute()`, the `onexecute` hook that
       `sql.begin()` uses to reserve a connection sits behind
       `sent.length < max_pipeline`, so at zero it never fires and every
       `sql.begin()` fails with UNSAFE_TRANSACTION. `transaction()` below is
       the replacement; nothing in this codebase may call `sql.begin()`. */
    max_pipeline: 0,
    /* Throughput only, now that correctness does not depend on it: a page
       that fans out wider than this queues rather than wedges. The affiliate
       admin overview issues six at once; ten leaves room without being a wide
       pool, since these multiplex through Supavisor onto far fewer backends. */
    max: 10,
    /* Short in production, where a frozen serverless instance should not sit
       on connections. Long in development: `next dev` is one long-lived
       process, often far from the database, and a reconnect there costs
       seconds (TLS plus pooler auth across an ocean) on the first click after
       every pause. */
    idle_timeout: process.env.NODE_ENV === "development" ? 600 : 20,
    /* Nothing here is worth making a visitor wait on. The preview job has its
       own deadline and a slow database must not eat into it. */
    connect_timeout: 10,
    onnotice: () => {},
  };
  client = postgres(url, options);
  return client;
}

/**
 * Runs `work`, and turns any failure into `fallback`.
 *
 * Every database call in this codebase goes through here. The log line carries
 * the operation name and the error text only — never a row, never an address,
 * never an email — because these lines end up in a hosting provider's log
 * search where a lead's address has no business being.
 */
export async function tryDb<T>(operation: string, work: (sql: Sql) => Promise<T>, fallback: T): Promise<T> {
  const sql = db();
  if (!sql) return fallback;

  try {
    return await work(sql);
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    console.warn(`[db] ${operation} failed, continuing without it — ${why.slice(0, 200)}`);
    return fallback;
  }
}

/** A connection held for one transaction; every query on it reaches the same backend. */
export type Tx = ReservedSql;

/**
 * Runs `fn` inside one transaction on one reserved connection.
 *
 * The replacement for `sql.begin()`, which cannot work here — see
 * `max_pipeline` above. `reserve()` takes a connection out of the pool
 * directly rather than through the hook that setting disables, and a reserved
 * connection is what a transaction needs anyway: BEGIN and COMMIT have to
 * reach the same backend, which through a transaction pooler means the same
 * client connection for the duration.
 *
 * A failed commit rolls back; a failed rollback is not allowed to mask the
 * error that caused it; and the connection goes back to the pool whatever
 * happened. Nothing more — no savepoints, no prepared transactions — because
 * nothing here uses them.
 *
 * One quirk to know about when reading an error from in here: if the
 * connection dies mid-transaction, postgres.js's `release()` returns it to the
 * open queue regardless, so the next `reserve()` can be handed the dead socket
 * — which belongs to any `reserve()` user rather than to this function, and
 * surfaces here because every statement in `fn` errors on it in turn.
 */
export async function transaction<T>(client: Sql, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await client.reserve();
  try {
    await tx`begin`;
    try {
      const result = await fn(tx);
      await tx`commit`;
      return result;
    } catch (err) {
      await tx`rollback`.catch(() => undefined);
      throw err;
    }
  } finally {
    tx.release();
  }
}
