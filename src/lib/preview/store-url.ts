/**
 * Turning a visitor-typed domain into something safe to fetch.
 *
 * Everything downstream of here talks to a host chosen by a stranger, so this
 * module is the only place allowed to decide that a URL may be requested. Two
 * gates: a syntactic one (`normaliseStoreInput`, which also strips the paths and
 * schemes people paste) and a network one (`assertPublicHost`, which resolves
 * DNS and refuses anything pointing back inside our own network).
 */

import { isIP } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";

/** The failures a caller can sensibly show a visitor. */
export type StoreAccessCode = "blocked" | "unreachable" | "timeout";

export class StoreAccessError extends Error {
  readonly code: StoreAccessCode;

  constructor(code: StoreAccessCode, message: string) {
    super(message);
    this.name = "StoreAccessError";
    this.code = code;
  }
}

const MAX_HOST_LENGTH = 253;
const MAX_REDIRECTS = 5;

/* Names that never belong to a public storefront. `.local` is mDNS, `.internal`
   is the convention on most private clouds, `.home.arpa` is the RFC 8375 one.
   Exported because the browser stage applies the same list to every request the
   page makes, not just the one we chose. */
export const PRIVATE_SUFFIXES = [
  ".local",
  ".internal",
  ".localhost",
  ".home.arpa",
  ".lan",
  ".intranet",
];

const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * The half of the guard that needs no network: everything decidable from the
 * name alone. Split out because request interception has to answer in the
 * moment — a page fires hundreds of subresource requests and a DNS round trip
 * on each one would cost more than the screenshot is worth.
 *
 * An IP literal in *any* form is refused outright. A real storefront and every
 * CDN it uses has a name; a literal is either a mistake or the whole attack.
 */
export function isSyntacticallyPublicHost(host: string): boolean {
  const name = host.trim().toLowerCase().replace(/\.$/, "");
  if (!name || name.length > MAX_HOST_LENGTH) return false;

  /* A URL hostname wears its IPv6 in brackets; strip them so `isIP` can see it. */
  const bare = name.startsWith("[") && name.endsWith("]") ? name.slice(1, -1) : name;
  if (isIP(bare) !== 0) return false;
  if (!bare.includes(".")) return false; // `localhost`, intranet short names
  return !PRIVATE_SUFFIXES.some((suffix) => bare.endsWith(suffix));
}

/**
 * Accepts what people actually type — `mystore.com`, `MYSTORE.COM/`,
 * `https://mystore.com/collections/all`, `mystore.myshopify.com`, with stray
 * whitespace — and returns the bare lowercase host, or null if it could never
 * be a public storefront.
 */
export function normaliseStoreInput(raw: string): string | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  /* A space inside the value is always a typo, and `new URL` would happily
     percent-encode it into a host we never meant to visit. */
  if (/\s/.test(trimmed)) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;

  /* WHATWG parsing already lowercased, punycoded and canonicalised any IPv4
     spelling (`0x7f000001`, `127.1`), so the checks below see one form only. */
  const host = url.hostname.replace(/\.$/, "");
  if (!isSyntacticallyPublicHost(host)) return null;

  const labels = host.split(".");
  if (labels.some((label) => label.length === 0 || label.length > 63 || !LABEL.test(label))) {
    return null;
  }
  /* A numeric or one-character TLD is never real, and rejecting it closes off
     the dotted-decimal shapes that survive canonicalisation. */
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return null;

  return host;
}

function ipv4Bytes(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    bytes.push(n);
  }
  return bytes;
}

function ipv6Bytes(ip: string): number[] | null {
  const address = ip.split("%")[0]; // drop any zone id
  const halves = address.split("::");
  if (halves.length > 2) return null;

  const groups = (chunk: string): number[] | null => {
    if (chunk === "") return [];
    const out: number[] = [];
    for (const group of chunk.split(":")) {
      if (group.includes(".")) {
        const embedded = ipv4Bytes(group);
        if (!embedded) return null;
        out.push(...embedded);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
      const n = Number.parseInt(group, 16);
      out.push((n >> 8) & 0xff, n & 0xff);
    }
    return out;
  };

  const head = groups(halves[0]);
  const tail = halves.length === 2 ? groups(halves[1]) : [];
  if (!head || !tail) return null;

  if (halves.length === 2) {
    const fill = 16 - head.length - tail.length;
    if (fill < 0) return null;
    return [...head, ...new Array<number>(fill).fill(0), ...tail];
  }
  return head.length === 16 ? head : null;
}

/**
 * True only for addresses that are routable on the public internet. Everything
 * else — loopback, RFC 1918, link-local (which is where the cloud metadata
 * services live), CGNAT, ULA, multicast, reserved — is a way back into our own
 * network and must never be fetched on a visitor's say-so.
 */
function isPublicAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const b = ipv4Bytes(ip);
    if (!b) return false;
    const [a, second] = b;
    if (a === 0) return false; // 0.0.0.0/8, unspecified
    if (a === 10) return false; // private
    if (a === 127) return false; // loopback
    if (a === 169 && second === 254) return false; // link-local incl. 169.254.169.254
    if (a === 172 && second >= 16 && second <= 31) return false; // private
    if (a === 192 && second === 168) return false; // private
    if (a === 100 && second >= 64 && second <= 127) return false; // CGNAT
    if (a === 192 && second === 0) return false; // 192.0.0/24 + TEST-NET-1
    if (a === 198 && (second === 18 || second === 19)) return false; // benchmarking
    if (a === 198 && second === 51) return false; // TEST-NET-2
    if (a === 203 && second === 0) return false; // TEST-NET-3
    if (a >= 224) return false; // multicast, reserved, broadcast
    return true;
  }

  if (version === 6) {
    const b = ipv6Bytes(ip);
    if (!b) return false;
    if (b.every((byte) => byte === 0)) return false; // ::
    if (b.slice(0, 15).every((byte) => byte === 0) && b[15] === 1) return false; // ::1
    /* ::ffff:a.b.c.d — an IPv4 address wearing a v6 hat; judge the v4. */
    if (b.slice(0, 10).every((byte) => byte === 0) && b[10] === 0xff && b[11] === 0xff) {
      return isPublicAddress(b.slice(12).join("."));
    }
    if ((b[0] & 0xfe) === 0xfc) return false; // fc00::/7 ULA, incl. fd00:ec2::254
    if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return false; // fe80::/10 link-local
    if (b[0] === 0xfe && (b[1] & 0xc0) === 0xc0) return false; // fec0::/10 site-local
    if (b[0] === 0xff) return false; // multicast
    return true;
  }

  return false;
}

/**
 * Resolves `host` (A and AAAA) and throws unless every answer is public.
 * "Every", not "the first": a name that resolves to one public and one private
 * address is an attack, not a store.
 */
export async function assertPublicHost(host: string): Promise<void> {
  if (isIP(host) !== 0) {
    if (!isPublicAddress(host)) {
      throw new StoreAccessError("blocked", `${host} is not a public address`);
    }
    return;
  }

  const [v4, v6] = await Promise.allSettled([resolve4(host), resolve6(host)]);
  const addresses = [
    ...(v4.status === "fulfilled" ? v4.value : []),
    ...(v6.status === "fulfilled" ? v6.value : []),
  ];

  if (addresses.length === 0) {
    throw new StoreAccessError("unreachable", `${host} has no DNS records`);
  }

  for (const address of addresses) {
    if (!isPublicAddress(address)) {
      throw new StoreAccessError("blocked", `${host} resolves to the non-public address ${address}`);
    }
  }
}

export type SafeFetchOptions = {
  headers?: Record<string, string>;
  /** Whole-request budget, redirects included. */
  timeoutMs?: number;
  /** Body is truncated here; oversized responses are not an error. */
  maxBytes?: number;
};

export type SafeFetchResult = {
  /** The URL that actually served the body, after redirects. */
  url: string;
  status: number;
  contentType: string | null;
  body: string;
  truncated: boolean;
};

function decode(bytes: Uint8Array, contentType: string | null): string {
  const charset = contentType?.match(/charset=["']?([\w-]+)/i)?.[1];
  if (charset && !/^utf-?8$/i.test(charset)) {
    try {
      return new TextDecoder(charset).decode(bytes);
    } catch {
      /* Unknown label — fall through to UTF-8 rather than lose the page. */
    }
  }
  return new TextDecoder("utf-8").decode(bytes);
}

async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<{ body: string; truncated: boolean }> {
  const contentType = response.headers.get("content-type");
  if (!response.body) return { body: "", truncated: false };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      if (size + value.byteLength > maxBytes) {
        chunks.push(value.subarray(0, maxBytes - size));
        size = maxBytes;
        truncated = true;
        break;
      }
      chunks.push(value);
      size += value.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: decode(merged, contentType), truncated };
}

/**
 * The only fetch this feature is allowed to make. Re-runs the SSRF guard on
 * every hop, because a public host is free to 302 to 169.254.169.254 — which is
 * exactly why `redirect: "manual"` is not optional here.
 *
 * Caveat worth knowing: we resolve the name, then `fetch` resolves it again, so
 * a DNS answer that flips between the two calls slips through. Closing that
 * needs a pinned-IP connector (undici `lookup`), which is a bigger change than
 * this feature warrants; the checks below stop every non-adversarial case and
 * the adversary gains only a request with no response body they can read.
 */
export async function safeFetch(url: string, init: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const { timeoutMs = 10_000, maxBytes = 2 * 1024 * 1024, headers = {} } = init;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let target = url;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      let parsed: URL;
      try {
        parsed = new URL(target);
      } catch {
        throw new StoreAccessError("blocked", `not a URL: ${target}`);
      }

      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new StoreAccessError("blocked", `refusing ${parsed.protocol} redirect`);
      }
      if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
        throw new StoreAccessError("blocked", `refusing port ${parsed.port}`);
      }
      await assertPublicHost(parsed.hostname);

      const response = await fetch(parsed, {
        redirect: "manual",
        signal: controller.signal,
        headers,
      });

      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel().catch(() => {});
        target = new URL(location, parsed).toString();
        continue;
      }

      const { body, truncated } = await readCapped(response, maxBytes);
      return {
        url: parsed.toString(),
        status: response.status,
        contentType: response.headers.get("content-type"),
        body,
        truncated,
      };
    }

    throw new StoreAccessError("unreachable", `more than ${MAX_REDIRECTS} redirects`);
  } catch (err) {
    if (err instanceof StoreAccessError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new StoreAccessError("timeout", `timed out after ${timeoutMs}ms`);
    }
    throw new StoreAccessError("unreachable", err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}
