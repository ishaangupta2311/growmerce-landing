/**
 * The job itself.
 *
 * One rule governs the whole pipeline: only the first stage is allowed to fail
 * the request. If we cannot reach the store at all there is nothing to show, so
 * that error propagates; everything after it is an enrichment, and a missing
 * enrichment costs the visitor a detail, not the page. Each stage therefore
 * logs one line and moves on.
 *
 * Nothing here ever sees the visitor's email — it is taken by /api/trial-lead
 * and never travels with the job.
 */

import { readPreviewCache, writePreviewCache } from "./cache";
import { extractMeta, extractStylesheetTheme } from "./extract";
import { fetchSite } from "./fetch-site";
import { fetchProducts } from "./products";
import { captureSite } from "./screenshot";
import { finishTheme } from "./theme";
import type { PreviewResult, PreviewTheme, PreviewThemeSource } from "./types";

function why(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** A theme is only "computed" if the browser gave us the two colours that matter. */
function isUsable(theme: Partial<PreviewTheme>): boolean {
  return Boolean(theme.background && (theme.accent || theme.text));
}

export async function buildPreview(host: string): Promise<PreviewResult> {
  const cached = await readPreviewCache(host);
  if (cached) return cached;

  const site = await fetchSite(host);

  let meta: ReturnType<typeof extractMeta> = { title: null, favicon: null, logo: null };
  try {
    meta = extractMeta(site.html, site.finalUrl);
  } catch (err) {
    console.warn(`[preview] ${host}: metadata skipped — ${why(err)}`);
  }

  let computed: Partial<PreviewTheme> = {};
  let screenshot: string | null = null;
  try {
    const capture = await captureSite(site.finalUrl);
    if (capture) {
      screenshot = capture.screenshot;
      computed = capture.theme;
    } else {
      console.info(`[preview] ${host}: no browser available, falling back to stylesheets`);
    }
  } catch (err) {
    console.warn(`[preview] ${host}: screenshot skipped — ${why(err)}`);
  }

  /* The stylesheet pass costs three more requests, so it only runs when the
     browser left a hole worth filling. */
  let stylesheet: Partial<PreviewTheme> | null = null;
  if (!isUsable(computed) || !computed.accent) {
    try {
      stylesheet = await extractStylesheetTheme(site.html, site.finalUrl);
    } catch (err) {
      console.warn(`[preview] ${host}: stylesheet theme skipped — ${why(err)}`);
    }
  }

  let products: PreviewResult["products"] = [];
  try {
    products = await fetchProducts(site.finalUrl, site.platform, site.html);
  } catch (err) {
    console.warn(`[preview] ${host}: products skipped — ${why(err)}`);
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
    fetchedAt: new Date().toISOString(),
  };

  await writePreviewCache(host, result);
  return result;
}
