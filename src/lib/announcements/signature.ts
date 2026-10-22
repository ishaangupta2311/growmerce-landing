import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Proving that a release announcement really came from the Growsearch app.
 *
 * The scheme is the merchant-email one (src/lib/growsearch/email.ts) pointed
 * this way: `x-growmerce-timestamp` is Unix time in milliseconds, and
 * `x-growmerce-signature` is `sha256=` and the hex HMAC-SHA256 of
 * `<timestamp>.<path>.<rawBody>` under ANNOUNCE_SECRET. The timestamp is
 * inside the signed string so a captured request goes stale in five minutes;
 * the path is, so a captured `skip` cannot be replayed as a `draft`.
 *
 * Its own secret, not PORTAL_EMAIL_SECRET: a key that can put a draft in
 * front of the owner should not also be able to email every merchant, and the
 * reverse.
 *
 * Pure and free of `server-only` so scripts/announcements-signature-check.ts
 * can run it outside Next. Reading the secret from the environment is the
 * route's job.
 */

/** How far a request's timestamp may be from our clock, either way. */
export const MAX_SKEW_MS = 5 * 60 * 1000;

/** Shorter than this is treated as unset: a guessable key authenticates nobody. */
export const MIN_SECRET_LENGTH = 32;

export const SIGNATURE_HEADER = "x-growmerce-signature";
export const TIMESTAMP_HEADER = "x-growmerce-timestamp";

export type SignatureFailure =
  | "not_configured" // no usable secret on this deployment
  | "missing" // a header absent
  | "malformed" // a header present but not in the expected shape
  | "stale" // timestamp outside the window
  | "mismatch"; // signature did not verify

export type SignatureCheck = { ok: true } | { ok: false; reason: SignatureFailure };

/** The hex signature for one request: what the app computes before sending. */
export function signAnnouncement(timestamp: string | number, path: string, rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${path}.${rawBody}`).digest("hex");
}

/**
 * Whether a request is genuinely from the app.
 *
 * `rawBody` must be the exact text read off the request, never a re-serialised
 * parse; `path` is the request path, e.g. `/api/announcements/draft`. The
 * timestamp is signed as the header text itself, so the two sides never have
 * to agree on how to print a number.
 */
export function verifyAnnouncement(input: {
  secret: string | null | undefined;
  timestamp: string | null;
  signature: string | null;
  path: string;
  rawBody: string;
  now?: number;
}): SignatureCheck {
  const secret = input.secret?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) return { ok: false, reason: "not_configured" };

  const stamp = input.timestamp?.trim();
  const header = input.signature?.trim();
  if (!stamp || !header) return { ok: false, reason: "missing" };

  if (!/^\d{1,16}$/.test(stamp)) return { ok: false, reason: "malformed" };
  const timestamp = Number(stamp);
  if (Math.abs((input.now ?? Date.now()) - timestamp) > MAX_SKEW_MS) return { ok: false, reason: "stale" };

  if (!header.startsWith("sha256=")) return { ok: false, reason: "malformed" };
  const offered = header.slice("sha256=".length);
  if (!/^[0-9a-f]{64}$/i.test(offered)) return { ok: false, reason: "malformed" };

  const expected = signAnnouncement(stamp, input.path, input.rawBody, secret);
  /* Both are 32 bytes by construction (the regex above, and the digest), so
     timingSafeEqual cannot throw on a length mismatch. */
  const same = timingSafeEqual(Buffer.from(offered.toLowerCase(), "hex"), Buffer.from(expected, "hex"));
  return same ? { ok: true } : { ok: false, reason: "mismatch" };
}
