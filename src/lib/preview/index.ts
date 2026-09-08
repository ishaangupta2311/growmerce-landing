/**
 * The job itself.
 *
 * One rule governs the whole pipeline: only the first stage is allowed to fail
 * the request. If we cannot reach the store at all there is nothing to show, so
 * that error propagates; everything after it is an enrichment, and a missing
 * enrichment costs the visitor a detail, not the page.
 *
 * The second rule is the clock. Every stage draws from one budget set here, and
 * a stage that no longer fits is skipped rather than started — the route is
 * capped at 60 s, and a job killed at the cap returns a 504 instead of the
 * partial preview this whole design exists to produce.
 *
 * Nothing here ever sees the visitor's email — it is taken by /api/trial-lead
 * and never travels with the job. The log lines below are deliberately made of
 * hostnames, statuses and durations: no addresses, no secrets, no query strings.
 */

import { CACHE_TTL_MS, DEGRADED_TTL_MS, readPreviewCache, writePreviewCache } from "./cache";
import { createDeadline } from "./deadline";
import { extractMeta, extractStylesheetTheme } from "./extract";
import { fetchSite } from "./fetch-site";
import { fetchProducts } from "./products";
import { pickQuery } from "./query";
import { captureSite } from "./screenshot";
import { finishTheme } from "./theme";
import type { NativeSearch, PreviewResult, PreviewTheme, PreviewThemeSource } from "./types";

/* Comfortably inside the route's maxDuration of 60, with room left to serialise
   a response that now carries two ~200 KB data URLs. */
const TOTAL_BUDGET_MS = 45_000;
const RESERVE_MS = 3_000;

const FETCH_BUDGET_MS = 20_000;
/* Two page loads — the storefront, then its search answering our query — plus
   the launch. The old 15 s covered one; this is what the browser stage gets
   when the fetch and the catalogue were quick, which they nearly always are. */
const SCREENSHOT_BUDGET_MS = 28_000;
const STYLESHEET_BUDGET_MS = 6_000;
const PRODUCTS_BUDGET_MS = 8_000;

type Detail = Record<string, string | number | boolean | null>;

function logStage(host: string, stage: string, startedAt: number, detail: Detail): void {
  const fields = Object.entries(detail)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  console.info(`[preview] host=${host} stage=${stage} ms=${Date.now() - startedAt} ${fields}`);
}

function why(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 200);
}

/** A theme is only "computed" if the browser gave us the two colours that matter. */
function isUsable(theme: Partial<PreviewTheme>): boolean {
  return Boolean(theme.background && (theme.accent || theme.text));
}

export async function buildPreview(host: string): Promise<PreviewResult> {
  const deadline = createDeadline(TOTAL_BUDGET_MS, RESERVE_MS);
  const jobStartedAt = Date.now();

  const cached = await readPreviewCache(host);
  logStage(host, "cache", jobStartedAt, { outcome: cached.outcome });
  if (cached.result) return cached.result;

  let startedAt = Date.now();
  const site = await fetchSite(host, Math.min(FETCH_BUDGET_MS, deadline.spendable()));
  logStage(host, "fetch", startedAt, {
    status: site.status,
    platform: site.platform,
    bytes: site.html.length,
  });

  startedAt = Date.now();
  let meta: ReturnType<typeof extractMeta> = { title: null, favicon: null, logo: null };
  try {
    meta = extractMeta(site.html, site.finalUrl);
    logStage(host, "meta", startedAt, {
      title: Boolean(meta.title),
      logo: Boolean(meta.logo),
      favicon: Boolean(meta.favicon),
    });
  } catch (err) {
    logStage(host, "meta", startedAt, { ok: false, reason: why(err) });
  }

  /* The catalogue comes before the browser now: the query we type into the
     store's own search is picked from it, and the browser needs that query. */
  startedAt = Date.now();
  let products: PreviewResult["products"] = [];
  try {
    products =
      deadline.spent(1_000) ?
        []
      : await fetchProducts(
          site.finalUrl,
          site.platform,
          site.html,
          Math.min(PRODUCTS_BUDGET_MS, deadline.spendable()),
        );
    logStage(host, "products", startedAt, { count: products.length, source: site.platform });
  } catch (err) {
    logStage(host, "products", startedAt, { ok: false, reason: why(err) });
  }

  /* The question both halves of the preview answer. Picked from the catalogue we
     just built, and picked once, here — see query.ts. */
  const query = pickQuery(products);

  startedAt = Date.now();
  let computed: Partial<PreviewTheme> = {};
  let screenshot: string | null = null;
  let nativeSearch: NativeSearch | null = null;
  try {
    const capture =
      deadline.spent(3_000) ?
        null
      : await captureSite(site.finalUrl, Math.min(SCREENSHOT_BUDGET_MS, deadline.spendable()));
    if (capture) {
      screenshot = capture.screenshot;
      computed = capture.theme;
      nativeSearch = capture.nativeSearch;
    }
    logStage(host, "screenshot", startedAt, {
      ok: Boolean(capture),
      bytes: screenshot?.length ?? 0,
      colours: Object.keys(computed).length,
    });
    logStage(host, "native", startedAt, {
      /* A photograph or nothing, so there is no count to keep apart from null
         any more — but the path is worth a line: it is the proof of whose
         search answered. The query string stays out, as every query does. */
      asked: nativeSearch !== null,
      path: nativeSearch ? new URL(nativeSearch.url).pathname : null,
    });
  } catch (err) {
    logStage(host, "screenshot", startedAt, { ok: false, reason: why(err) });
  }

  /* The stylesheet pass costs three more requests, so it only runs when the
     browser left a hole worth filling — and only if there is time. */
  let stylesheet: Partial<PreviewTheme> | null = null;
  if (!isUsable(computed) || !computed.accent) {
    startedAt = Date.now();
    try {
      stylesheet =
        deadline.spent(1_500) ?
          null
        : await extractStylesheetTheme(
            site.html,
            site.finalUrl,
            Math.min(STYLESHEET_BUDGET_MS, deadline.spendable()),
          );
      logStage(host, "stylesheet", startedAt, {
        ok: Boolean(stylesheet),
        colours: stylesheet ? Object.keys(stylesheet).length : 0,
        skipped: deadline.spent(1_500),
      });
    } catch (err) {
      logStage(host, "stylesheet", startedAt, { ok: false, reason: why(err) });
    }
  }

  const merged: Partial<PreviewTheme> = { ...(stylesheet ?? {}), ...computed };
  const themeSource: PreviewThemeSource =
    isUsable(computed) ? "computed"
    : stylesheet ? "stylesheet"
    : "default";

  const result: PreviewResult = {
    /* The host the visitor asked for, not where the redirects landed. It is the
       cache key, it is what the page echoes back to them, and a store that
       geo-redirects to `us.checkout.example.com` should not have that shown to
       them as their own domain. The real destination is `url`. */
    store: host,
    url: site.finalUrl,
    title: meta.title,
    platform: site.platform,
    logo: meta.logo,
    favicon: meta.favicon,
    screenshot,
    theme: finishTheme(themeSource === "default" ? {} : merged),
    themeSource,
    products,
    query,
    nativeSearch,
    fetchedAt: new Date().toISOString(),
  };

  /* A result with neither a picture nor a colour we found ourselves is a
     placeholder. Keep it briefly so a reload is cheap, but never for an hour —
     the store may simply have been having a bad minute. */
  const degraded = !screenshot && themeSource === "default";
  await writePreviewCache(host, result, degraded ? DEGRADED_TTL_MS : CACHE_TTL_MS);

  logStage(host, "done", jobStartedAt, {
    themeSource,
    screenshot: Boolean(screenshot),
    products: products.length,
    native: Boolean(nativeSearch),
    ttl: degraded ? DEGRADED_TTL_MS : CACHE_TTL_MS,
  });

  return result;
}
