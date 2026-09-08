# The "before" panel: photograph their search, don't redraw it

## Why this is being rewritten

The old before-panel asked Shopify's `/search/suggest.json` and rendered the
results as our own product cards. It shipped, and a merchant caught it. Two
independent defects, both confirmed against `www.boat-lifestyle.com`:

1. **We quoted a search no shopper uses.** boAt runs SearchTap — their real
   results live at `/pages/searchtap-search?q=…` (164 `searchtap` and 796
   `algolia` references in their homepage markup). We captioned Shopify's
   suggest endpoint with *their domain name* and the words "these are its
   results".

2. **The endpoint answers gibberish.** Measured:

   ```
   suggest.json "a gift under $50 they'll actually use"  -> 6 products
   suggest.json "earphone"                               -> 6 products
   suggest.json "zzzqqqxyzzy nonsense term"              -> 6 products
   ```

   Six hits for nonsense means the six we displayed were never an answer. And
   because we drew them as tidy cards with images and prices, the panel made the
   merchant's existing search look *good* — an argument against buying
   Growsearch, fabricated by us, on the screen whose whole job is the opposite.

The replacement is a photograph. We drive the store's own search box in a real
browser and screenshot whatever the store shows a shopper. No re-rendering, no
mock, no fallback.

## Feasibility is already established

Measured with headless Chrome against boAt, 1440×900:

```
"earphone"                              -> 61 product links, "Showing 322 Results"
"a gift under $50 they'll actually use" -> "Your connection needs to be verified before you can proceed"
"something to help me focus while working" -> same challenge
```

Run 1 reproduces the merchant's own screenshot exactly. Runs 2 and 3 hit boAt's
bot challenge because they were rapid repeats. **That challenge page must never
be screenshotted and passed off as their search results** — it is the same
mistake `fetch-site.ts` already guards against for Cloudflare's "Just a
moment…" interstitial. Detect it, return null.

## Contract (already written — do not change it)

`src/lib/preview/types.ts`:

```ts
export type NativeSearch = {
  query: string;
  /** Their search results page as a data URL (image/jpeg), full viewport. */
  screenshot: string;
  /** Where their own search took us. Proof of what the screenshot shows. */
  url: string;
  source: "storefront-search";
};
```

`PreviewResult.nativeSearch` stays `NativeSearch | null`.

**`null` is the only degraded state.** No browser, no findable search box, a
challenge page, an error page, no time left — all null. When it is null the UI
renders no before-panel whatsoever. There is deliberately no partial rendering:
a mock of a merchant's own search, shown to that merchant, is the specific
failure this rewrite exists to end.

An *empty* results page is not null. If their search runs and honestly finds
nothing, that screenshot is the single most valuable image in the product —
capture it and show it.

## Non-negotiables

- **Reuse the existing browser.** The search capture happens in a second `Page`
  of the same `Browser` that `captureSite` already launched. Launching Chrome
  twice doubles the most expensive stage in the pipeline.
- **The SSRF guard stays on.** The new page gets the same
  `setRequestInterception(true)` + `handleRequest` treatment as the homepage
  page. This page follows a merchant-controlled URL; it is not exempt.
- **Respect the deadline.** Every stage draws from the one budget created in
  `buildPreview`. A stage that no longer fits is skipped, not started.
- **Never defeat bot protection.** If a store challenges us, we return null and
  show nothing. Do not add fingerprint evasion, stealth plugins, UA spoofing
  beyond what we already send, or retry loops designed to slip past a
  challenge. nykaa.com already refuses headless Chrome outright and that is a
  legitimate outcome.
- **No named functions inside `page.evaluate`.** esbuild's `keepNames` under
  `tsx` injects a `__name` helper that does not exist in the page. Existing code
  in `screenshot.ts` already obeys this; match it.

## Verification bar

Do not report done on a typecheck. Run real stores and look at the images.
`www.boat-lifestyle.com` is the reference case — the capture must reproduce the
"Showing 322 Result(s)" page. Space repeat runs out or vary hosts so you are
measuring their search and not their rate limiter.
