/**
 * Turning a visitor-typed domain into something safe to fetch.
 *
 * Everything downstream of here talks to a host chosen by a stranger, so this
 * module is the only place allowed to decide that a URL may be requested. Two
 * gates: a syntactic one (`normaliseStoreInput`, which also strips the paths and
 * schemes people paste) and a network one (`assertPublicHost`, which resolves
 * DNS and refuses anything pointing back inside our own network).
 *
 * Only the network gate lives here. The syntactic one moved to
 * `src/lib/store-domain.ts` so the /try form can run the identical rules in the
 * browser instead of keeping a mirror of them that drifts; it is re-exported
 * below so this module is still the one surface a server caller needs.
 */

import { isIP } from "node:net";
import { Resolver } from "node:dns/promises";

/* Relative, like every other cross-module import under src/lib/preview. */
export {
  isSyntacticallyPublicHost,
  normaliseStoreInput,
  PRIVATE_SUFFIXES,
} from "../store-domain";

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

const MAX_REDIRECTS = 5;

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
    const [a, second, third] = b;
    if (a === 0) return false; // 0.0.0.0/8, unspecified
    if (a === 10) return false; // private
    if (a === 127) return false; // loopback
    if (a === 169 && second === 254) return false; // link-local incl. 169.254.169.254
    if (a === 172 && second >= 16 && second <= 31) return false; // private
    if (a === 192 && second === 168) return false; // private
    if (a === 100 && second >= 64 && second <= 127) return false; // CGNAT
    if (a === 198 && (second === 18 || second === 19)) return false; // benchmarking
    /* These four are /24s and must be matched as /24s. Blocking the enclosing
       /16 took 192.0.78.0/24 with it — that is Automattic, so every
       WordPress.com-hosted WooCommerce store, which is squarely who this
       feature is for. */
    if (a === 192 && second === 0 && third === 0) return false; // IETF protocol assignments
    if (a === 192 && second === 0 && third === 2) return false; // TEST-NET-1
    if (a === 198 && second === 51 && third === 100) return false; // TEST-NET-2
    if (a === 203 && second === 0 && third === 113) return false; // TEST-NET-3
    if (a >= 224) return false; // multicast, reserved, broadcast
    return true;
  }

  if (version === 6) {
    const b = ipv6Bytes(ip);
    if (!b) return false;
    if (b.every((byte) => byte === 0)) return false; // ::
    if (b.slice(0, 15).every((byte) => byte === 0) && b[15] === 1) return false; // ::1
    /* Anything that smuggles an IPv4 address inside a v6 one. Each of these
       reaches 169.254.169.254 with a completely different spelling, and a
       classifier that only knows ::ffff: waves them through:
         ::ffff:a.b.c.d   IPv4-mapped — judge the v4
         2002:V4::/16     6to4 — judge the v4; a public v4 here is a real host
         64:ff9b::/96     NAT64 well-known prefix
         64:ff9b:1::/48   NAT64 local-use prefix (RFC 8215)
         ::a.b.c.d        deprecated IPv4-compatible
       The two NAT64 prefixes are translator infrastructure, never a storefront,
       so they go regardless of what they carry. */
    if (b.slice(0, 10).every((byte) => byte === 0) && b[10] === 0xff && b[11] === 0xff) {
      return isPublicAddress(b.slice(12).join("."));
    }
    if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b) return false;
    if (b[0] === 0x20 && b[1] === 0x02) return isPublicAddress(b.slice(2, 6).join("."));
    if (b.slice(0, 12).every((byte) => byte === 0)) return false; // ::/96
    if ((b[0] & 0xfe) === 0xfc) return false; // fc00::/7 ULA, incl. fd00:ec2::254
    if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return false; // fe80::/10 link-local
    if (b[0] === 0xfe && (b[1] & 0xc0) === 0xc0) return false; // fec0::/10 site-local
    if (b[0] === 0xff) return false; // multicast
    return true;
  }

  return false;
}

export const DEFAULT_DNS_TIMEOUT_MS = 4_000;

/**
 * Resolves `host` (A and AAAA) and throws unless every answer is public.
 * "Every", not "the first": a name that resolves to one public and one private
 * address is an attack, not a store.
 *
 * `timeoutMs` is not optional in spirit — a resolver that never answers used to
 * hang past every other limit in the pipeline, because the fetch timeout only
 * ever covered the fetch. A dedicated `Resolver` is what makes the bound real:
 * the module-level `resolve4`/`resolve6` take no timeout at all.
 */
export async function assertPublicHost(
  host: string,
  timeoutMs: number = DEFAULT_DNS_TIMEOUT_MS,
): Promise<void> {
  if (isIP(host) !== 0) {
    if (!isPublicAddress(host)) {
      throw new StoreAccessError("blocked", `${host} is not a public address`);
    }
    return;
  }

  const resolver = new Resolver({ timeout: Math.max(250, timeoutMs), tries: 1 });
  const [v4, v6] = await Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)]);
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
  const deadlineAt = Date.now() + timeoutMs;

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
      const left = deadlineAt - Date.now();
      if (left <= 0) throw new StoreAccessError("timeout", `timed out after ${timeoutMs}ms`);
      /* DNS shares the request's budget rather than getting one of its own — the
         caller asked for an answer within `timeoutMs`, resolution included. */
      await assertPublicHost(parsed.hostname, Math.min(DEFAULT_DNS_TIMEOUT_MS, left));

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
