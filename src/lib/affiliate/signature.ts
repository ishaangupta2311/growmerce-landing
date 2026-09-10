import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Proving that an affiliate event really came from the Growsearch app.
 *
 * This endpoint writes money into the ledger, so it is the one route on the
 * site where "fail closed" is not a preference. A forged `charge.succeeded`
 * credits an attacker's own partner account with 30% of a number they chose;
 * there is no degraded mode worth having.
 *
 * The scheme is the ordinary one — HMAC-SHA256 over `timestamp.body`, sent in
 * two headers — and the two details that make it worth anything:
 *
 *   The **timestamp is inside the signed string**, not merely alongside it.
 *   Signing only the body means a captured request stays valid forever, and
 *   replaying one `charge.succeeded` a thousand times is the cheapest attack
 *   there is. (`affiliate.event.external_id` would in fact catch that one, but
 *   an authentication layer that leans on a downstream uniqueness constraint is
 *   one refactor away from not working.)
 *
 *   The comparison is **constant-time**. A byte-by-byte early return leaks the
 *   correct digest a byte at a time to anyone willing to make enough requests.
 */

/** How far out of date a request may be. Five minutes covers clock drift and a
 *  retry queue; it does not cover a capture replayed the next morning. */
const MAX_SKEW_MS = 5 * 60 * 1000;

export type SignatureFailure =
  | "not_configured" // no shared secret on this deployment
  | "missing" // one of the two headers absent
  | "malformed" // header present but not in the expected shape
  | "stale" // timestamp outside the window
  | "mismatch"; // signature did not verify

export type SignatureCheck = { ok: true } | { ok: false; reason: SignatureFailure };

export const SIGNATURE_HEADER = "x-growmerce-signature";
export const TIMESTAMP_HEADER = "x-growmerce-timestamp";

function secret(): string | null {
  const value = process.env.AFFILIATE_INGEST_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

/**
 * The signature for a body and timestamp, for the sender's side and the tests.
 *
 * The Growsearch app computes exactly this over the bytes it is about to send —
 * which is why the verifier below takes the raw body text rather than a parsed
 * object. Re-serialising JSON to check a signature means the check passes only
 * as long as two runtimes agree on key order and number formatting, and one day
 * they will not.
 */
export function signPayload(timestamp: number, body: string, key: string): string {
  return createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex");
}

/**
 * Whether this request is genuinely from the Growsearch app.
 *
 * `rawBody` must be the exact text read off the request — see above.
 *
 * `not_configured` is deliberately not a pass. A deployment without
 * `AFFILIATE_INGEST_SECRET` cannot authenticate anyone, and the safe reading of
 * that is "nobody", not "everybody". It is reported separately from a genuine
 * mismatch so the log line tells an operator which of the two they have.
 */
export function verifySignature(request: Request, rawBody: string): SignatureCheck {
  const key = secret();
  if (!key) return { ok: false, reason: "not_configured" };

  const header = request.headers.get(SIGNATURE_HEADER);
  const stamp = request.headers.get(TIMESTAMP_HEADER);
  if (!header || !stamp) return { ok: false, reason: "missing" };

  const timestamp = Number(stamp);
  if (!Number.isSafeInteger(timestamp)) return { ok: false, reason: "malformed" };

  /* Absolute difference, so a sender whose clock runs fast is rejected as
     firmly as one whose clock runs slow. A future-dated timestamp is the more
     suspicious of the two. */
  if (Math.abs(Date.now() - timestamp) > MAX_SKEW_MS) return { ok: false, reason: "stale" };

  const offered = header.startsWith("sha256=") ? header.slice("sha256=".length) : header;
  if (!/^[0-9a-f]{64}$/i.test(offered)) return { ok: false, reason: "malformed" };

  const expected = signPayload(timestamp, rawBody, key);
  /* Both are 64 hex characters by construction — the regex above guarantees it
     for one and the digest length for the other — so timingSafeEqual cannot
     throw on a length mismatch here. */
  const same = timingSafeEqual(
    Buffer.from(offered.toLowerCase(), "hex"),
    Buffer.from(expected, "hex"),
  );

  return same ? { ok: true } : { ok: false, reason: "mismatch" };
}
