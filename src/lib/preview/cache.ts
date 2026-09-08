/**
 * A preview costs a browser launch and half a dozen requests to somebody else's
 * server, and nobody should pay for it twice. Three layers, fastest first:
 *
 *   memory  — a Map in this process. Gone with the process.
 *   disk    — a mirror in the tmpdir, for `next dev`, which spreads requests
 *             across worker processes that would otherwise each keep their own
 *             cold Map. Written to a temp file and renamed into place, because
 *             entries run to 150–250 KB and a reader arriving mid-write would
 *             otherwise parse a torn file.
 *   Postgres — preview-store.ts. Shared across instances and deploys, and the
 *             only layer that outlives a Vercel process. A build writes through
 *             to all three; a hit lower down is copied up into memory.
 *
 * The hour below is the life of the two local layers, and with a database
 * configured it is a retention policy, not the rebuild interval: after an hour
 * the row comes back from Postgres in one round trip, and a store is only
 * rebuilt when its row is a week old. Without a database — a supported mode,
 * not a broken one — the hour is the rebuild interval, as it always was.
 *
 * The disk mirror stays even though Postgres also spans dev workers, because
 * the machines that run `next dev` are the ones most likely to have no
 * `DATABASE_URL`, and a sleeping database must not turn a laptop back into
 * N workers rebuilding the same shop.
 */

import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readStoredPreview, storePreview } from "./preview-store";
import type { PreviewResult } from "./types";

export const CACHE_TTL_MS = 60 * 60 * 1000;
/**
 * A preview with no screenshot and default colours is a placeholder, not an
 * answer. Pinning one for an hour means a visitor whose store was briefly behind
 * a challenge page cannot retry into a good one.
 */
export const DEGRADED_TTL_MS = 5 * 60 * 1000;

const MAX_ENTRIES = 50;
const DIRECTORY = join(tmpdir(), "growmerce-preview");

type Entry = { at: number; ttl: number; result: PreviewResult };

const memory = new Map<string, Entry>();

function fileFor(host: string): string {
  /* The host is already validated, but it ends up in a path — belt and braces. */
  return join(DIRECTORY, `${host.replace(/[^a-z0-9.-]/gi, "_").slice(0, 120)}.json`);
}

function fresh(entry: Entry): boolean {
  return Date.now() - entry.at < (entry.ttl ?? CACHE_TTL_MS);
}

/**
 * Puts an entry in memory and keeps the Map bounded. Every path that fills
 * memory comes through here — a hit copied up from disk or Postgres counts
 * against the limit the same as a fresh build, or the Map only ever shrinks
 * on builds and grows on everything else.
 */
function remember(host: string, entry: Entry): void {
  memory.set(host, entry);
  while (memory.size > MAX_ENTRIES) {
    const oldest = memory.keys().next();
    if (oldest.done) break;
    const evicted = oldest.value;
    memory.delete(evicted);
    /* The mirror follows the Map out, or the directory grows without bound —
       nothing else ever deletes an entry for a host we stop seeing. */
    void unlink(fileFor(evicted)).catch(() => {});
  }
}

export type CacheOutcome = "memory" | "disk" | "db" | "miss";

export type CacheRead = { result: PreviewResult | null; outcome: CacheOutcome };

async function readDisk(host: string): Promise<Entry | null> {
  try {
    const entry = JSON.parse(await readFile(fileFor(host), "utf8")) as Entry;
    return entry?.result && fresh(entry) ? entry : null;
  } catch {
    return null;
  }
}

export async function readPreviewCache(host: string): Promise<CacheRead> {
  const hit = memory.get(host);
  if (hit) {
    if (fresh(hit)) {
      /* Re-insert so the eviction in `remember` drops the genuinely coldest entry. */
      memory.delete(host);
      memory.set(host, hit);
      return { result: hit.result, outcome: "memory" };
    }
    memory.delete(host);
  }

  const onDisk = await readDisk(host);
  if (onDisk) {
    remember(host, onDisk);
    return { result: onDisk.result, outcome: "disk" };
  }

  const stored = await readStoredPreview(host);
  if (stored) {
    /* The memory copy may not outlive the row it came from: a placeholder with
       ten minutes left on its thirty must not sit in this process for an hour
       after Postgres would have rebuilt it. Floor of one so that `fresh` sees
       a TTL rather than an unset one. */
    const layerTtl = stored.degraded ? DEGRADED_TTL_MS : CACHE_TTL_MS;
    remember(host, {
      at: Date.now(),
      ttl: Math.max(1, Math.min(layerTtl, stored.remainingMs)),
      result: stored.result,
    });
    return { result: stored.result, outcome: "db" };
  }

  return { result: null, outcome: "miss" };
}

/** Deletes anything on disk older than the longest TTL we hand out. */
async function sweep(): Promise<void> {
  const names = await readdir(DIRECTORY);
  const now = Date.now();
  await Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => {
        const path = join(DIRECTORY, name);
        try {
          const info = await stat(path);
          if (now - info.mtimeMs > CACHE_TTL_MS) await unlink(path);
        } catch {
          /* Raced with another sweep or another worker. Nothing to do. */
        }
      }),
  );
}

async function mirrorToDisk(host: string, entry: Entry): Promise<void> {
  try {
    await mkdir(DIRECTORY, { recursive: true });
    /* Write beside the target and rename over it: rename is atomic within a
       filesystem, so a concurrent reader sees either the old file or the new
       one, never half of either. */
    const target = fileFor(host);
    const scratch = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(scratch, JSON.stringify(entry), "utf8");
    await rename(scratch, target);
    await sweep();
  } catch (err) {
    /* The mirror is an optimisation; the in-memory copy already landed. */
    console.warn("[preview] could not mirror cache to disk:", err instanceof Error ? err.message : err);
  }
}

export async function writePreviewCache(
  host: string,
  result: PreviewResult,
  ttlMs = CACHE_TTL_MS,
): Promise<void> {
  const entry: Entry = { at: Date.now(), ttl: ttlMs, result };
  remember(host, entry);

  /* The caller has already judged the result: a placeholder arrives asking for
     DEGRADED_TTL_MS, a real preview for CACHE_TTL_MS. The row carries that
     same verdict rather than re-deriving it from the result, so the local
     layers and the database can never disagree about what is a placeholder. */
  const degraded = ttlMs <= DEGRADED_TTL_MS;

  /* Both are best-effort and neither throws. They run together because each
     is a ~250 KB write on the visitor's clock and there is no reason for one
     to wait on the other. The database write is awaited rather than dropped:
     on Vercel a promise left behind after the response is not promised to
     finish, and a row that did not land is the next visitor's browser launch. */
  await Promise.all([mirrorToDisk(host, entry), storePreview(host, result, degraded)]);
}
