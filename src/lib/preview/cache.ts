/**
 * A preview costs a browser launch and half a dozen requests to somebody else's
 * server, and a visitor reloading the page should not pay for it twice. One
 * hour is long enough to cover a session and short enough that a store that
 * relaunches its theme is not stuck with yesterday's colours.
 *
 * The tmpdir mirror exists for `next dev`, which spreads requests across worker
 * processes that would otherwise each keep their own cold Map.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { PreviewResult } from "./types";

const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 50;
const DIRECTORY = join(tmpdir(), "growmerce-preview");

type Entry = { at: number; result: PreviewResult };

const memory = new Map<string, Entry>();

function fileFor(host: string): string {
  /* The host is already validated, but it ends up in a path — belt and braces. */
  return join(DIRECTORY, `${host.replace(/[^a-z0-9.-]/gi, "_").slice(0, 120)}.json`);
}

function fresh(entry: Entry): boolean {
  return Date.now() - entry.at < TTL_MS;
}

export async function readPreviewCache(host: string): Promise<PreviewResult | null> {
  const hit = memory.get(host);
  if (hit) {
    if (fresh(hit)) {
      /* Re-insert so the eviction below drops the genuinely coldest entry. */
      memory.delete(host);
      memory.set(host, hit);
      return hit.result;
    }
    memory.delete(host);
  }

  try {
    const entry = JSON.parse(await readFile(fileFor(host), "utf8")) as Entry;
    if (!entry?.result || !fresh(entry)) return null;
    memory.set(host, entry);
    return entry.result;
  } catch {
    return null;
  }
}

export async function writePreviewCache(host: string, result: PreviewResult): Promise<void> {
  const entry: Entry = { at: Date.now(), result };

  memory.set(host, entry);
  while (memory.size > MAX_ENTRIES) {
    const oldest = memory.keys().next();
    if (oldest.done) break;
    memory.delete(oldest.value);
  }

  try {
    await mkdir(DIRECTORY, { recursive: true });
    await writeFile(fileFor(host), JSON.stringify(entry), "utf8");
  } catch (err) {
    /* The mirror is an optimisation; the in-memory copy already landed. */
    console.warn("[preview] could not mirror cache to disk:", err instanceof Error ? err.message : err);
  }
}
