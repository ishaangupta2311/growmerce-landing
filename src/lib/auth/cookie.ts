/**
 * The admin session cookie: what it is called and how it is signed.
 *
 * Shared by `src/proxy.ts` and `src/lib/auth/session.ts`, so it uses only Web
 * Crypto — no Node APIs, no database, no `server-only` — and runs wherever
 * Proxy is deployed.
 *
 * The cookie is `<token>.<expires>.<signature>`:
 *
 *   token      32 random bytes. The database stores only its SHA-256, so the
 *              session row alone cannot be turned back into a cookie.
 *   expires    Unix seconds. Checked here so an expired cookie is turned away
 *              at the door without a query.
 *   signature  HMAC-SHA256 of the first two parts under SESSION_SECRET. Lets
 *              Proxy reject a forged or edited cookie without the database;
 *              the database lookup in session.ts then decides whether the
 *              session still exists (logout deletes it).
 */

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const encoder = new TextEncoder();

/**
 * `__Host-` makes the browser refuse the cookie unless it is Secure, host-only
 * and path `/` — nothing on a sibling subdomain can set or shadow it. It
 * requires HTTPS, so development (which is browsed over plain HTTP from other
 * machines on the tailnet) uses the bare name.
 */
export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-gm_admin_session" : "gm_admin_session";
}

export function sessionCookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

/** The signing secret, or null when it is missing or too short to trust. */
export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export function randomToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** Hex SHA-256 — the form a token or a throttle key is stored in. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signSessionValue(token: string, expiresAt: number, secret: string): Promise<string> {
  const payload = `${token}.${expiresAt}`;
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
}

export type SessionCookie = { token: string; expiresAt: number };

/**
 * The token inside a cookie value, or null when the value is malformed, the
 * signature does not verify, or it has expired. `crypto.subtle.verify`
 * compares in constant time.
 */
export async function readSessionValue(value: string, secret: string | null): Promise<SessionCookie | null> {
  const session = await verifySessionValue(value, secret);
  if (!session || session.expiresAt * 1000 <= Date.now()) return null;
  return session;
}

/**
 * Like `readSessionValue` but ignoring expiry — logout uses it to delete the
 * row behind a cookie that has only just lapsed.
 */
export async function readSessionToken(value: string, secret: string | null): Promise<string | null> {
  return (await verifySessionValue(value, secret))?.token ?? null;
}

async function verifySessionValue(value: string, secret: string | null): Promise<SessionCookie | null> {
  if (!secret) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [token, expires, signature] = parts;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token) || !/^\d{1,12}$/.test(expires)) return null;

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    signatureBytes,
    encoder.encode(`${token}.${expires}`),
  );
  return valid ? { token, expiresAt: Number(expires) } : null;
}
