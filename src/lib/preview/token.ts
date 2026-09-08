/**
 * Short-lived, signed permission to run one preview job.
 *
 * The preview endpoint does real network work on an arbitrary host, so it must
 * not be an open proxy. A token proves the caller went through /api/trial-lead
 * for *this* store; it is not authentication and carries nothing private — just
 * the host and an expiry, signed so neither can be edited.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TTL_MS = 15 * 60 * 1000;

let cachedSecret: string | null = null;

function secret(): string {
  if (cachedSecret !== null) return cachedSecret;

  const fromEnv = process.env.PREVIEW_TOKEN_SECRET?.trim();
  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  /* In production a random per-process key is not a degraded mode, it is an
     outage: /api/trial-lead signs on one instance and /api/preview verifies on
     another, so every visitor is told their link expired the moment they use it.
     Better to refuse to start than to ship a form that never works. */
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PREVIEW_TOKEN_SECRET must be set in production — preview tokens are signed with it and must verify across instances.",
    );
  }

  /* Outside production a per-process key still stops tampering; it just means
     every restart invalidates outstanding tokens. Warn once — noisy on a dev
     server that reloads constantly, and useless more than once. */
  console.warn(
    "[preview] PREVIEW_TOKEN_SECRET is not set — using a random per-process secret. Preview tokens will not survive a restart.",
  );
  cachedSecret = randomBytes(32).toString("hex");
  return cachedSecret;
}

function sign(store: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${store}\n${exp}`).digest("base64url");
}

export function signPreviewToken(store: string): string {
  const exp = Date.now() + TTL_MS;
  return `${exp}.${sign(store, exp)}`;
}

export function verifyPreviewToken(token: string, store: string): boolean {
  if (typeof token !== "string" || token.length > 512) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const exp = Number(token.slice(0, dot));
  if (!Number.isSafeInteger(exp) || exp <= Date.now()) return false;

  const given = Buffer.from(token.slice(dot + 1));
  const wanted = Buffer.from(sign(store, exp));
  /* timingSafeEqual throws on a length mismatch, and the length of a base64url
     SHA-256 digest is public anyway, so the early return leaks nothing. */
  if (given.length !== wanted.length) return false;
  return timingSafeEqual(given, wanted);
}
