/**
 * Step one of the job: get the store's homepage HTML and work out what it runs
 * on. Everything after this reads the string this returns, so it is also where
 * the "https, then http" fallback lives — plenty of small stores still redirect
 * the other way or serve a bad certificate.
 */

import { safeFetch, StoreAccessError } from "./store-url";
import type { PreviewPlatform } from "./types";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;

/* Statuses that mean "we got there and were told no", as opposed to "nothing
   answered". 401/403 are the bot walls; 406 is Akamai's variant; 429 is the
   store rate limiting us. Retrying http:// after one of these is pointless —
   the same edge serves both schemes — so `fetchSite` stops rather than
   burning the budget on a second refusal. */
const REFUSAL_STATUSES = new Set([401, 403, 406, 429]);

/**
 * A real Chrome identity. Bot-shaped agents get a challenge page or a 403 from
 * most storefront WAFs, which would cost us the theme for no gain.
 *
 * Exported because *every* request in this pipeline has to send the same ones.
 * Shopify Markets resolves a market per request from headers like
 * `accept-language`, so asking for the HTML as a browser and the catalogue as a
 * bare JSON client got two different answers: a Kith keychain came back as
 * `₹3500` because the amount was read from one market and the currency from
 * another.
 */
export const BROWSER_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "upgrade-insecure-requests": "1",
};

export type SiteFetch = {
  html: string;
  /** The URL that served the HTML, after redirects. */
  finalUrl: string;
  platform: PreviewPlatform;
  /** Upstream status, for the log line. Always 2xx/3xx — see `fetchSite`. */
  status: number;
};

function detectPlatform(html: string, finalUrl: string): PreviewPlatform {
  const haystack = `${finalUrl}\n${html.slice(0, 400_000)}`;
  if (/cdn\.shopify\.com|Shopify\.theme|shopify-section|\.myshopify\.com|shopify-features/i.test(haystack)) {
    return "shopify";
  }
  if (/woocommerce|wp-content\/plugins\/woocommerce|wc-ajax/i.test(haystack)) return "woocommerce";
  if (/cdn\d*\.bigcommerce\.com|bigcommerce\.com\/s-|stencil-utils/i.test(haystack)) return "bigcommerce";
  if (/\/static\/version\d+\/frontend\/|magento|mage\/cookies/i.test(haystack)) return "magento";
  return "other";
}

export async function fetchSite(host: string, budgetMs = TIMEOUT_MS * 2): Promise<SiteFetch> {
  let lastError: StoreAccessError | null = null;
  const startedAt = Date.now();

  for (const scheme of ["https", "http"] as const) {
    const left = budgetMs - (Date.now() - startedAt);
    if (left <= 500) break;

    try {
      const result = await safeFetch(`${scheme}://${host}/`, {
        timeoutMs: Math.min(TIMEOUT_MS, left),
        maxBytes: MAX_BYTES,
        headers: BROWSER_HEADERS,
      });

      /* A 403 challenge page is not the store. Treating it as one meant we
         screenshotted Cloudflare's "Just a moment…", took its colours as the
         brand's, and cached the lot for an hour — so the visitor could not even
         retry into a better answer. */
      if (result.status >= 400) {
        /* A store that answers 403 is not unreachable — we reached it and its
           edge turned us away, which is what Akamai/Cloudflare bot protection
           does to anything without a real browser fingerprint. Saying "check
           the domain" there sends a merchant hunting a typo that isn't
           there. */
        if (REFUSAL_STATUSES.has(result.status)) {
          throw new StoreAccessError("refused", `${scheme}: HTTP ${result.status}`);
        }
        lastError = new StoreAccessError("unreachable", `${scheme}: HTTP ${result.status}`);
        continue;
      }

      if (!result.body.trim()) {
        lastError = new StoreAccessError("unreachable", `${scheme}: empty body`);
        continue;
      }

      return {
        html: result.body,
        finalUrl: result.url,
        platform: detectPlatform(result.body, result.url),
        status: result.status,
      };
    } catch (err) {
      const failure =
        err instanceof StoreAccessError ? err : (
          new StoreAccessError("unreachable", err instanceof Error ? err.message : String(err))
        );
      /* A blocked host is blocked on every scheme — retrying over http only
         delays the same answer. */
      if (failure.code === "blocked" || failure.code === "refused") throw failure;
      lastError = failure;
    }
  }

  throw lastError ?? new StoreAccessError("unreachable", `could not reach ${host}`);
}

