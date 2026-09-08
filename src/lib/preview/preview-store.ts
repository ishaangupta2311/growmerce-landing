/**
 * The durable layer of the preview cache: one row per storefront, in Postgres.
 *
 * The Map and the tmpdir mirror in cache.ts die with the process that filled
 * them, and on Vercel a process lives for one burst of traffic. So a shop
 * somebody previewed on Monday was rebuilt — browser launch, six requests to
 * their server, half a minute — for the colleague they sent the link to on
 * Tuesday. A build now writes through here and the next instance, on the next
 * day, reads it back in one round trip. A row is good for a week (a store that
 * relaunches its theme sees the old colours until then; the owner chose that
 * trade) and a placeholder for thirty minutes, both measured on the database's
 * own clock so that a skewed lambda cannot shorten or stretch either.
 *
 * Every query goes through `tryDb`, so a database that is asleep — Supabase
 * pauses a quiet free project after about a week — costs a cache miss and
 * nothing else. What `tryDb` cannot do is make that miss *cheap*. Measured from
 * a laptop, the pooler takes ~2 s to reject a bad credential and an unroutable
 * host burns the whole 10 s connect timeout, and one cold build asks the
 * database three times: the route's pre-read, buildPreview's own read, then the
 * write-through. Three of those under a 45 s job is past the route's 60 s cap,
 * which would turn a sleeping database into 504s. So after one failure this
 * module stops asking for a minute. A database that is down costs us a cache; a
 * database that is down *slowly* must not cost us the funnel.
 *
 * Nothing here ever sees the visitor's email. It is taken by /api/trial-lead
 * and stays there; a preview row is the storefront and what we showed for it,
 * and the only log lines are a domain, an operation name and a duration.
 */

import type { Sql } from "postgres";

import { DEGRADED_TTL_MS, PREVIEW_TTL_MS, db, tryDb } from "@/lib/db";

import type { PreviewResult } from "./types";

export type StoredPreview = {
  result: PreviewResult;
  degraded: boolean;
  /** How long the row has left before it is rebuilt. Always positive on a hit. */
  remainingMs: number;
};

/**
 * How long to stop asking after a failure. Long enough that a burst of visitors
 * during a pause pays for one timeout per instance, not one each; short enough
 * that a project woken from the dashboard is back in the chain within a minute.
 */
const RETRY_AFTER_MS = 60_000;

let pausedUntil = 0;

/**
 * `tryDb` hands back its fallback both when the query ran and found nothing and
 * when the query could not run at all, and only the second should open the
 * breaker. So the fallback is a value no query ever returns.
 */
const UNAVAILABLE = Symbol("db-unavailable");

async function attempt<T>(operation: string, work: (sql: Sql) => Promise<T>): Promise<T | null> {
  /* No `DATABASE_URL` is a supported mode, and it must not read as a failure —
     `tryDb` would return the sentinel for it too, and the funnel would log a
     breaker warning every minute on a machine that simply has no database. */
  if (!db()) return null;
  if (Date.now() < pausedUntil) return null;

  const outcome = await tryDb<T | typeof UNAVAILABLE>(operation, work, UNAVAILABLE);
  if (outcome !== UNAVAILABLE) return outcome;

  pausedUntil = Date.now() + RETRY_AFTER_MS;
  console.warn(`[db] ${operation} unavailable — not asking the database again for ${RETRY_AFTER_MS / 1000}s`);
  return null;
}

type Row = { result: PreviewResult; degraded: boolean; remaining_ms: number };

/**
 * The stored preview for `domain`, or null when there is none, it has expired,
 * or the database could not answer. Expiry is decided in SQL so that an expired
 * row is never shipped over the wire — they run to 250 KB — and so that both
 * sides of the comparison come from the same clock that stamped `fetched_at`.
 */
export async function readStoredPreview(domain: string): Promise<StoredPreview | null> {
  return attempt("preview.read", async (sql) => {
    const rows = await sql<Row[]>`
      with live as (
        select
          result,
          degraded,
          fetched_at,
          (case when degraded then ${DEGRADED_TTL_MS}::bigint else ${PREVIEW_TTL_MS}::bigint end)
            * interval '1 millisecond' as ttl
        from marketing.preview
        where domain = ${domain}
      )
      select
        result,
        degraded,
        (extract(epoch from (fetched_at + ttl - now())) * 1000)::bigint as remaining_ms
      from live
      where fetched_at + ttl > now()
    `;
    const row = rows[0];
    if (!row) return null;
    return { result: row.result, degraded: row.degraded, remainingMs: Number(row.remaining_ms) };
  });
}

/**
 * Writes `result` through as the row for `domain`, replacing whatever was there.
 * Resolves false when the database did not take it, which the caller treats as
 * nothing more than "the next instance will rebuild".
 */
export async function storePreview(domain: string, result: PreviewResult, degraded: boolean): Promise<boolean> {
  const stored = await attempt("preview.write", async (sql) => {
    await sql`
      insert into marketing.preview (domain, result, degraded, fetched_at, updated_at)
      values (${domain}, ${sql.json(result)}, ${degraded}, now(), now())
      on conflict (domain) do update set
        result     = excluded.result,
        degraded   = excluded.degraded,
        fetched_at = excluded.fetched_at,
        updated_at = now()
    `;
    return true;
  });
  return stored === true;
}
