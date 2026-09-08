/**
 * What a storefront domain is allowed to look like — the half of the guard
 * that needs no network, and therefore the half both sides can run.
 *
 * This lives outside `src/lib/preview/` and imports nothing from Node because
 * the /try form has to apply exactly these rules in the browser. It used to be
 * two copies: the server's, and a mirror of it in TryForm. A mirror is a bug
 * waiting for the next edit — the two only have to disagree once for a visitor
 * to be waved through the form, popped a demo tab, and landed on a preview
 * page whose only advice is to go back and start again. One module, imported
 * by both, is the only version of this that stays true.
 *
 * `src/lib/preview/store-url.ts` keeps the other half — DNS resolution and the
 * private-range checks — and re-exports these so its own callers see one
 * surface.
 *
 * `new URL` is the load-bearing part. It is the same WHATWG parser in Node and
 * in every browser, so it lowercases, punycodes and canonicalises the awkward
 * spellings (`0x7f000001`, `127.1`, `[::1]`, trailing dots, IDNs) identically
 * on both sides before any rule below looks at them.
 */

export const MAX_HOST_LENGTH = 253;

/* Names that never belong to a public storefront. `.local` is mDNS, `.internal`
   is the convention on most private clouds, `.home.arpa` is the RFC 8375 one.
   Exported because the browser stage applies the same list to every request the
   screenshotted page makes, not just the one we chose. */
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
 * Is this hostname an IP literal rather than a name?
 *
 * Stands in for `node:net`'s `isIP`, which cannot be imported here. It is
 * deliberately allowed to be *stricter* than `isIP` — every extra thing it
 * calls a literal is one more host we refuse, which is the safe direction —
 * but never looser:
 *
 * - a colon appears in no real hostname, so it can only be IPv6 (bracketed,
 *   bare, zone-suffixed, or IPv4-mapped);
 * - IPv4 is only ever seen here in the canonical dotted-quad form, because
 *   every caller passes a `URL.hostname` and WHATWG rewrites `127.1` and
 *   `0x7f000001` to `127.0.0.1` on the way in.
 *
 * Nothing this rejects could have been a storefront: a dotted-quad's last
 * label is numeric, which `normaliseStoreInput` refuses anyway.
 */
export function isIpLiteral(host: string): boolean {
  if (host.includes(":") || host.startsWith("[")) return true;
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  return host.split(".").every((octet) => Number(octet) <= 255);
}

/**
 * Everything decidable from the name alone. Split out because request
 * interception has to answer in the moment — a page fires hundreds of
 * subresource requests and a DNS round trip on each one would cost more than
 * the screenshot is worth.
 *
 * An IP literal in *any* form is refused outright. A real storefront and every
 * CDN it uses has a name; a literal is either a mistake or the whole attack.
 */
export function isSyntacticallyPublicHost(host: string): boolean {
  const name = host.trim().toLowerCase().replace(/\.$/, "");
  if (!name || name.length > MAX_HOST_LENGTH) return false;

  /* A URL hostname wears its IPv6 in brackets. Brackets around anything else
     is not a shape `new URL` can produce, so it is refused rather than
     unwrapped and trusted. */
  if (name.startsWith("[")) return false;
  if (isIpLiteral(name)) return false;
  if (!name.includes(".")) return false; // `localhost`, intranet short names
  return !PRIVATE_SUFFIXES.some((suffix) => name.endsWith(suffix));
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

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;

  const host = url.hostname.replace(/\.$/, "");
  if (!isSyntacticallyPublicHost(host)) return null;

  const labels = host.split(".");
  if (
    labels.some(
      (label) => label.length === 0 || label.length > 63 || !LABEL.test(label),
    )
  ) {
    return null;
  }
  /* A numeric or one-character TLD is never real, and rejecting it closes off
     the dotted-decimal shapes that survive canonicalisation. */
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return null;

  return host;
}
