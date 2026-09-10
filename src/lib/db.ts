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

import postgres, { type Sql } from "postgres";

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

  client = postgres(url, {
    /* Supavisor's transaction mode hands a different backend to each
       statement, so a prepared statement from an earlier one is not there. */
    prepare: false,
    /* **This must be larger than the most queries any one page issues at once.**
       Not for speed — for correctness. postgres.js does not queue the overflow
       here: with `prepare: false` against Supavisor, issuing more concurrent
       queries than `max` deadlocks the client. The extra queries never run,
       never time out and never reject, so the page hangs forever and the only
       symptom is a spinner.

       It was 3, which was fine until a page did four things in one
       `Promise.all`. The affiliate admin overview fans out to six. Ten leaves
       room without being a wide pool — and since the URL is Supavisor's
       transaction pooler, these are multiplexed onto far fewer real backends,
       which is the whole reason to be on it. */
    max: 10,
    idle_timeout: 20,
    /* Nothing here is worth making a visitor wait on. The preview job has its
       own deadline and a slow database must not eat into it. */
    connect_timeout: 10,
    onnotice: () => {},
  });
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
