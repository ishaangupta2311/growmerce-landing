/**
 * Per-IP budgets for the two routes that cost us money.
 *
 * The hard part is not the counting, it is knowing who to count. `x-forwarded-for`
 * is a list a client can start: a proxy *appends* its observation, so the
 * leftmost entry is whatever the caller wrote and the rightmost is what our own
 * edge saw. Keying on the leftmost entry is the same as not rate limiting at
 * all — change one octet and the budget resets. Verified against this route
 * before the fix.
 *
 * In memory, so it resets on deploy and does not span instances. That is the
 * right trade for a marketing site: it exists to stop a bored visitor looping a
 * form, and the real ceiling on the expensive stage is the browser semaphore in
 * screenshot.ts, not this.
 */

export type Budget = {
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Map<string, number[]>>();

/**
 * The closest thing to a trusted client address we have. Vercel's own header is
 * set by the platform and cannot be spoofed from outside; failing that, the
 * rightmost `x-forwarded-for` entry is the one our edge appended.
 */
export function clientKey(request: Request): string {
  return clientKeyFromHeaders(request.headers);
}

/** The same rule for callers holding headers rather than a Request (Server Actions). */
export function clientKeyFromHeaders(headers: { get(name: string): string | null }): string {
  const platform = headers.get("x-vercel-forwarded-for")?.trim();
  if (platform) return platform;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Records a hit and reports whether the caller has already used up `budget`. */
export function overBudget(name: string, key: string, budget: Budget): boolean {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map<string, number[]>();
    buckets.set(name, bucket);
  }

  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((at) => now - at < budget.windowMs);

  if (recent.length >= budget.limit) {
    bucket.set(key, recent);
    return true;
  }

  recent.push(now);
  bucket.set(key, recent);

  /* Sweep occasionally so a long-lived process does not hold every address it
     ever saw. Cheap, and only once the Map is big enough to be worth it. */
  if (bucket.size > 500) {
    for (const [ip, times] of bucket) {
      if (times.every((at) => now - at >= budget.windowMs)) bucket.delete(ip);
    }
  }
  return false;
}
