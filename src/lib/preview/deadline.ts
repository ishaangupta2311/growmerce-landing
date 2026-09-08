/**
 * One clock for the whole job.
 *
 * Every stage used to carry its own timeout, which is fine in isolation and
 * wrong in aggregate: https 10 s, then http 10 s, then a browser launch on
 * Puppeteer's own 30 s default, then a 15 s capture, then stylesheets and
 * products — a worst case of about 79 s against a route capped at 60. The
 * platform kills the function and the visitor gets a 504 instead of the partial
 * preview this pipeline exists to produce.
 *
 * So the budget is set once, at the top, and every stage asks how much is left.
 * A stage that cannot fit is skipped, which is always better than one that runs
 * and takes the response down with it.
 */

export type Deadline = {
  /** Milliseconds left, never negative. */
  remaining(): number;
  /** Milliseconds left minus the reserve kept for finishing the response. */
  spendable(): number;
  /** True when there is not enough left to be worth starting a stage. */
  spent(minimumMs?: number): boolean;
};

export function createDeadline(totalMs: number, reserveMs = 0): Deadline {
  const endsAt = Date.now() + totalMs;
  return {
    remaining: () => Math.max(0, endsAt - Date.now()),
    spendable: () => Math.max(0, endsAt - Date.now() - reserveMs),
    spent: (minimumMs = 0) => endsAt - Date.now() - reserveMs <= minimumMs,
  };
}

/** Rejects if `work` has not settled in `ms`. The work itself keeps running. */
export function withDeadline<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms).unref?.();
    }),
  ]);
}
