/**
 * A handful of the store's real products, so the widget mock-up shows the
 * visitor their own catalogue rather than stock photography.
 *
 * Shopify hands this over for free at /products.json. Everyone else gets the
 * JSON-LD treatment: it is the one structured format an SEO-minded store is
 * almost guaranteed to emit, and it beats guessing at markup per platform.
 */

import { safeFetch } from "./store-url";
import type { PreviewPlatform, PreviewProduct } from "./types";

const MAX_PRODUCTS = 8;
/* Collect more than we need: the filter below throws a few away on most stores,
   and a second round trip to top up would cost more than the extra rows. */
const FETCH_LIMIT = 12;

/* Add-ons a store sells but a shopper does not think of as products. Shopify
   lists them in /products.json exactly like the real catalogue, so "Free Returns
   Coverage — $0.80" lands first on plenty of shops and makes the whole preview
   look broken. */
const NOT_MERCHANDISE =
  /\b(returns? coverage|shipping protection|package protection|route protection|insurance|warranty|gift ?card|e-?gift|tip|donation|extended protection)\b/i;
const TIMEOUT_MS = 8_000;
const MAX_BYTES = 1024 * 1024;

const SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "$",
  AUD: "$",
  NZD: "$",
  SGD: "$",
  HKD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  PLN: "zł ",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
  AED: "AED ",
};

/** Shopify writes its active currency into an inline script on every page. */
function detectCurrency(html: string): string | null {
  const shopify = html.match(/Shopify\.currency\s*=\s*\{[^}]{0,200}?["']?active["']?\s*:\s*["']([A-Z]{3})["']/);
  if (shopify) return shopify[1];
  const jsonLd = html.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/);
  if (jsonLd) return jsonLd[1];
  const meta = html.match(/itemprop=["']priceCurrency["'][^>]*content=["']([A-Z]{3})["']/i);
  return meta ? meta[1] : null;
}

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency ? (SYMBOLS[currency] ?? `${currency} `) : "$";
  /* Whole prices read better without the trailing zeros — ".00" on eight tiles
     is just noise. */
  const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbol}${value}`;
}

function toAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const n = Number.parseFloat(raw.replace(/[^\d.,-]/g, "").replace(/,(?=\d{3}\b)/g, ""));
  return Number.isFinite(n) ? n : null;
}

function absolute(value: unknown, base: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), base);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    /* See extract.ts: an http image is blocked on our https preview page. */
    if (url.protocol === "http:" && base.startsWith("https:")) url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type ShopifyProduct = {
  title?: unknown;
  handle?: unknown;
  images?: unknown;
  variants?: unknown;
  product_type?: unknown;
};

async function fromShopify(origin: string, currency: string | null): Promise<PreviewProduct[]> {
  const url = new URL(`/products.json?limit=${FETCH_LIMIT}`, origin).toString();
  const result = await safeFetch(url, {
    timeoutMs: TIMEOUT_MS,
    maxBytes: MAX_BYTES,
    headers: { accept: "application/json" },
  });
  if (result.status !== 200) return [];

  const parsed: unknown = JSON.parse(result.body);
  if (!isRecord(parsed) || !Array.isArray(parsed.products)) return [];

  const products: PreviewProduct[] = [];
  for (const entry of parsed.products as ShopifyProduct[]) {
    if (!isRecord(entry) || typeof entry.title !== "string") continue;
    if (typeof entry.product_type === "string" && NOT_MERCHANDISE.test(entry.product_type)) continue;

    const images = Array.isArray(entry.images) ? entry.images : [];
    const firstImage = isRecord(images[0]) ? images[0].src : null;

    const variants = Array.isArray(entry.variants) ? entry.variants : [];
    const price = isRecord(variants[0]) ? toAmount(variants[0].price) : null;

    products.push({
      title: entry.title.trim().slice(0, 120),
      price: price === null ? null : formatPrice(price, currency),
      image: absolute(firstImage, origin),
      url: typeof entry.handle === "string" ? absolute(`/products/${entry.handle}`, origin) : null,
    });
  }
  return products;
}

function pickImage(value: unknown, base: string): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = pickImage(item, base);
      if (found) return found;
    }
    return null;
  }
  if (isRecord(value)) return pickImage(value.url ?? value.contentUrl, base);
  return absolute(value, base);
}

function offerAmount(offers: unknown): { amount: number | null; currency: string | null } {
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const found = offerAmount(offer);
      if (found.amount !== null) return found;
    }
    return { amount: null, currency: null };
  }
  if (!isRecord(offers)) return { amount: null, currency: null };

  const amount = toAmount(offers.price ?? offers.lowPrice ?? offers.highPrice);
  const currency = typeof offers.priceCurrency === "string" ? offers.priceCurrency : null;
  if (amount !== null) return { amount, currency };
  return offerAmount(offers.offers);
}

function collectJsonLdProducts(node: unknown, base: string, out: PreviewProduct[]): void {
  if (out.length >= FETCH_LIMIT) return;

  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdProducts(item, base, out);
    return;
  }
  if (!isRecord(node)) return;

  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  const isProduct = types.some((t) => typeof t === "string" && /^product/i.test(t));

  if (isProduct && typeof node.name === "string") {
    const { amount, currency } = offerAmount(node.offers);
    out.push({
      title: node.name.trim().slice(0, 120),
      price: amount === null ? null : formatPrice(amount, currency),
      image: pickImage(node.image, base),
      url: absolute(node.url, base),
    });
    return;
  }

  /* ItemList wraps its members in `item`; @graph is the other common nesting. */
  for (const key of ["itemListElement", "@graph", "item", "mainEntity", "hasPart"]) {
    if (key in node) collectJsonLdProducts(node[key], base, out);
  }
}

function fromJsonLd(html: string, base: string): PreviewProduct[] {
  const out: PreviewProduct[] = [];
  const blocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!blocks) return out;

  for (const block of blocks.slice(0, 12)) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      collectJsonLdProducts(JSON.parse(body) as unknown, base, out);
    } catch {
      /* One malformed block is normal; the next one is usually fine. */
    }
    if (out.length >= FETCH_LIMIT) break;
  }
  return out;
}

export async function fetchProducts(
  finalUrl: string,
  platform: PreviewPlatform,
  html: string,
): Promise<PreviewProduct[]> {
  const origin = new URL(finalUrl).origin;
  const currency = detectCurrency(html);

  let products: PreviewProduct[] = [];
  if (platform === "shopify") {
    products = await fromShopify(origin, currency).catch((err: unknown) => {
      /* Worth a line: /products.json is rate-limited and occasionally refuses,
         and "no products" otherwise looks like the store having none. */
      console.warn(
        `[preview] ${origin}: products.json failed — ${err instanceof Error ? err.message : err}`,
      );
      return [];
    });
  }
  if (products.length === 0) products = fromJsonLd(html, origin);

  const seen = new Set<string>();
  return products
    .filter((product) => {
      const key = product.title.toLowerCase();
      if (!key || seen.has(key)) return false;
      if (NOT_MERCHANDISE.test(product.title)) return false;
      /* The widget is a grid of pictures. A row with nothing to show reads as a
         bug, so an imageless product is worth less than one fewer tile. */
      if (!product.image) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_PRODUCTS);
}
