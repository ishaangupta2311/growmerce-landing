/**
 * A preview costs a browser launch and half a dozen requests to somebody else's
 * server, and a visitor reloading the page should not pay for it twice. One
 * hour is long enough to cover a session and short enough that a store that
 * relaunches its theme is not stuck with yesterday's colours.
 *
 * The tmpdir mirror exists for `next dev`, which spreads requests across worker
 * processes that would otherwise each keep their own cold Map. It is written
 * through a temp file and renamed into place, because entries run to 150–200 KB
 * and a reader that arrives mid-write would otherwise parse a torn file.
 */

import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  return Date.now() - entry.at < (entry.ttl || CACHE_TTL_MS);
}

export type CacheOutcome = "memory" | "disk" | "miss";

export type CacheRead = { result: PreviewResult | null; outcome: CacheOutcome };

export async function readPreviewCache(host: string): Promise<CacheRead> {
  const hit = memory.get(host);
  if (hit) {
    if (fresh(hit)) {
      /* Re-insert so the eviction below drops the genuinely coldest entry. */
      memory.delete(host);
      memory.set(host, hit);
      return { result: hit.result, outcome: "memory" };
    }
    memory.delete(host);
  }

  try {
    const entry = JSON.parse(await readFile(fileFor(host), "utf8")) as Entry;
    if (!entry?.result || !fresh(entry)) return { result: null, outcome: "miss" };
    memory.set(host, entry);
    return { result: entry.result, outcome: "disk" };
  } catch {
    return { result: null, outcome: "miss" };
  }
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

export async function writePreviewCache(
  host: string,
  result: PreviewResult,
  ttlMs = CACHE_TTL_MS,
): Promise<void> {
  const entry: Entry = { at: Date.now(), ttl: ttlMs, result };

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
