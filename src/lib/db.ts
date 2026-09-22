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

import postgres, { type Options, type Sql } from "postgres";

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
       answered. postgres.js pipelines by default when there are more
       concurrent queries than connections, and Supavisor's transaction mode
       does not survive it: the pooled backend is left half-way through a
       message, the connection never answers again, and once all `max` of them
       are wedged every query queues forever. Reproduced against this project
       with five parallel queries on a warm pool of three; with this set to 0
       the same load completes every round. */
    max_pipeline: 0,
    /* With pipelining off the overflow queues instead of wedging, so this is a
       throughput number rather than a correctness one — but a page that fans
       out wider than the pool now waits in batches. The affiliate admin
       overview issues six queries in one `Promise.all`; ten clears that with
       room to spare and is still not a wide pool, since the URL is Supavisor's
       transaction pooler and these multiplex onto far fewer real backends.

       Both halves earned their place. The affiliate work first read this hang
       as "pool too small" and raised the number, which made it rarer without
       curing it; `max_pipeline: 0` is the fix. Raising `max` on its own would
       leave the same deadlock waiting for a wider fan-out. */
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
