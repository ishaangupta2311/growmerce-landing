/**
 * A fetch timeout that is safe to ship.
 *
 * `AbortSignal.timeout` is the right API and the one we want, but it throws on
 * Safari below 16 — and a throw here would be worse than no timeout at all,
 * because it would fire on every request from those browsers and send each of
 * them down the failure path. So it is feature-detected, with an
 * `AbortController` doing the same job where it is missing.
 *
 * The fallback's timer is deliberately not cleared: aborting a signal whose
 * fetch has already settled does nothing, and the alternative is threading a
 * cancel handle through every caller for no gain.
 */
export function timeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    try {
      return AbortSignal.timeout(ms);
    } catch {
      /* Present but unusable — fall through to the controller below. */
    }
  }

  if (typeof AbortController === "undefined") return undefined;

  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** True for both spellings of "we gave up waiting" — see `timeoutSignal`. */
export function isAbort(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  );
}
