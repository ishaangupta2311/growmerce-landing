/**
 * What the store's own search does with our question today.
 *
 * This is the "before" half of the preview, and the only reason it is worth
 * putting in front of a merchant is that it is real: we ask the same endpoint
 * the storefront's own search box asks, with the same identity we used for
 * everything else, and report what comes back.
 *
 * Which makes the null/empty distinction the entire integrity of the feature:
 *
 *   null            — we could not ask. Not Shopify, a non-200, an unparseable
 *                     body, no time left. The UI must say nothing at all.
 *   products: []    — we asked, and their search found nothing. The UI says so
 *                     to the merchant, in those words.
 *
 * Anything that blurs those two is a lie told to a shop owner about their own
 * shop, so every failure path below returns null explicitly rather than falling
 * through to an empty list.
 */

import { BROWSER_HEADERS } from "./fetch-site";
import { buildProducts, detectCurrency, type RawProduct } from "./products";
import { safeFetch } from "./store-url";
import type { NativeSearch, PreviewPlatform } from "./types";

const LIMIT = 6;
const TIMEOUT_MS = 6_000;
const MAX_BYTES = 512 * 1024;
/** Below this there is no point starting: we would only time out mid-request. */
const MINIMUM_BUDGET_MS = 1_200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function fetchNativeSearch(
  finalUrl: string,
  platform: PreviewPlatform,
  html: string,
  query: string,
  budgetMs: number,
): Promise<NativeSearch | null> {
  /* Only Shopify exposes its live search this way. Guessing at a Woo or
     BigCommerce equivalent and getting it wrong would produce exactly the fake
     this module exists to avoid. */
  if (platform !== "shopify") return null;
  if (budgetMs < MINIMUM_BUDGET_MS) return null;

  const origin = new URL(finalUrl).origin;
  const endpoint = new URL("/search/suggest.json", origin);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("resources[type]", "product");
  endpoint.searchParams.set("resources[limit]", String(LIMIT));

  let payload: unknown;
  try {
    const result = await safeFetch(endpoint.toString(), {
      timeoutMs: Math.min(TIMEOUT_MS, budgetMs),
      maxBytes: MAX_BYTES,
      /* Same identity as every other fetch, so Shopify Markets resolves the
         same market and these prices are comparable with the catalogue's. */
      headers: { ...BROWSER_HEADERS, accept: "application/json" },
    });
    if (result.status !== 200) return null;
    payload = JSON.parse(result.body);
  } catch {
    return null;
  }

  if (!isRecord(payload)) return null;
  const resources = payload.resources;
  if (!isRecord(resources)) return null;
  const results = resources.results;
  if (!isRecord(results)) return null;
  /* An absent `products` key means the shape was not what we expected, which is
     "could not ask". An empty array means they answered, and found nothing. */
  if (!Array.isArray(results.products)) return null;

  const raws: RawProduct[] = results.products.filter(isRecord).map((entry) => ({
    title: entry.title,
    price: entry.price,
    image: entry.image ?? entry.featured_image,
    url: entry.url,
  }));

  /* `suggest.json` reports no hit count of its own, so `total` stays null
     rather than being invented from the length of a capped list. */
  const total = typeof results.products_count === "number" ? results.products_count : null;

  return {
    query,
    products: buildProducts(raws, origin, detectCurrency(html), LIMIT, { requireImage: false }),
    total,
    source: "shopify-suggest",
  };
}
