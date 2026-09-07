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

/* A real Chrome string. Bot-shaped agents get a challenge page or a 403 from
   most storefront WAFs, which would cost us the theme for no gain. */
const BROWSER_HEADERS: Record<string, string> = {
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

export async function fetchSite(host: string): Promise<SiteFetch> {
  let lastError: StoreAccessError | null = null;

  for (const scheme of ["https", "http"] as const) {
    try {
      const result = await safeFetch(`${scheme}://${host}/`, {
        timeoutMs: TIMEOUT_MS,
        maxBytes: MAX_BYTES,
        headers: BROWSER_HEADERS,
      });

      if (!result.body.trim()) {
        lastError = new StoreAccessError("unreachable", `${scheme}: empty body`);
        continue;
      }

      return {
        html: result.body,
        finalUrl: result.url,
        platform: detectPlatform(result.body, result.url),
      };
    } catch (err) {
      const failure =
        err instanceof StoreAccessError ? err : (
          new StoreAccessError("unreachable", err instanceof Error ? err.message : String(err))
        );
      /* A blocked host is blocked on every scheme — retrying over http only
         delays the same answer. */
      if (failure.code === "blocked") throw failure;
      lastError = failure;
    }
  }

  throw lastError ?? new StoreAccessError("unreachable", `could not reach ${host}`);
}

