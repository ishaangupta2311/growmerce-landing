# "Try it free" → personalised preview

## What the visitor experiences

1. Every **Try it free** / **Start free trial** CTA on the site goes to `/try`.
2. `/try` asks for two things: **store domain** and **email**. That is the lead.
3. On submit the page becomes `/try/preview?store=<host>&t=<token>` and, in the
   same click, the **demo store opens in a new tab already unlocked** (see
   "Opening the demo store" below).
4. The preview page runs the job: reach the store → read its theme → take a
   screenshot → pull a few products. While it runs, a stepper shows progress.
   When it lands, the visitor sees **their storefront screenshot with the
   Growsearch widget drawn on top in their store's colours, fonts, radius and
   (where found) their own products.**
5. If the store can't be reached or nothing can be extracted, the page still
   delivers: the demo-store card is always there, and the widget renders on a
   synthesised storefront in default colours with a plain-language note.

The existing **See demo** gate (`DemoStoreButton`) is untouched.

## Opening the demo store

The Shopify demo store is password-protected. Its password page accepts a
plain cross-site form POST — verified with curl:

    POST https://aryan-dev-store-7x4hu1xc.myshopify.com/password
    form_type=storefront_password&utf8=✓&password=demo
    → 302 to / with a session cookie.  A wrong password → 200 (stays on the page).

So the site can submit a hidden `<form method="post" target="_blank">` with
those three fields **inside the user's click gesture** and the new tab lands on
the open storefront with no password step. Keep the password visible as a
fallback (popup blocked, Shopify changes the form): `DEMO_STORE_PASSWORD` in
`src/lib/site-urls.ts` is deliberately public.

## Environment

`PREVIEW_TOKEN_SECRET` — **required in production.** It signs the short-lived
tokens `/api/trial-lead` hands out and `/api/preview` checks. Outside production
an unset value falls back to a random per-process secret, which is fine on one
dev server and useless anywhere with more than one instance: the two routes
would land on different processes and every visitor would be told their link had
expired. `token.ts` therefore refuses to sign at all when `NODE_ENV` is
`production` and the variable is missing.

There is nowhere to obtain this value: generate it. It is an HMAC key, so any
random string works and the format is not checked.

```
openssl rand -hex 32
```

Set it in the host's environment (on Vercel, Settings -> Environment Variables,
then redeploy — env changes do not reach an already-built deployment), and use a
different value there than the one in your local `.env`. Rotating it is cheap:
tokens carry a 15-minute TTL, so the blast radius is whoever is mid-flow at that
moment, and they need only re-enter their domain.

`CHROME_PATH` — optional. Points the screenshot stage at a specific browser;
without it, well-known local paths are tried and then `@sparticuz/chromium`.

## Contract

`src/lib/preview/types.ts` is the contract between the API and the pages. Read
it before anything else. Summary:

- `POST /api/trial-lead` `{ email, source, store? }` → `{ ok: true, store?, token? }`.
  `store` is optional so the existing gate keeps working. When present it is
  normalised (scheme/paths/ports stripped, punycode ok) and validated; a
  signed, 15-minute token is returned for it.
- `POST /api/preview` `{ store, token }` → `PreviewResponse`. Node runtime,
  `maxDuration = 60`. Verifies the token before doing any network work.

## Job pipeline (`src/lib/preview/`)

`buildPreview(host)` orchestrates and **degrades step by step, never throws
for a visitor-caused reason**:

1. **URL + SSRF guard** (`store-url.ts`): `https://` first, then `http://`.
   Only ports 80/443. Resolve DNS and refuse loopback, private (10/8,
   172.16/12, 192.168/16), link-local (169.254/16, fe80::/10), CGNAT
   (100.64/10), unique-local (fc00::/7), `::1`, `0.0.0.0/8`, and metadata
   hosts. Re-check every redirect hop (max 5). Refuse bare IPs and
   `localhost`/`*.local`/`*.internal`.
2. **Fetch HTML** (`fetch-site.ts`): 10 s timeout, 2 MB cap, browser-like UA,
   `accept: text/html`. Records final URL and platform hints (Shopify:
   `cdn.shopify.com` / `Shopify.theme`; Woo: `woocommerce`; BigCommerce;
   Magento).
3. **Screenshot + computed theme** (`screenshot.ts`, `puppeteer-core`):
   viewport 1440×900, `deviceScaleFactor: 1`, block fonts? no — fonts matter.
   Block media/video/analytics-ish requests. Dismiss obvious cookie/newsletter
   modals by heuristics if cheap; do not spend more than 15 s total.
   In-page, read `getComputedStyle` for: body background/colour, header
   background, the first visible primary button (`button`, `.btn`,
   `[type=submit]`, `a.button`, Shopify `.button`) background/colour/radius,
   link colour, heading font-family. Return JPEG q70 as a data URL.
   Browser resolution order: `CHROME_PATH` env → local Chrome/Chromium on
   macOS/Linux well-known paths → `@sparticuz/chromium` (serverless). If none,
   skip this stage.
4. **Stylesheet theme fallback** (`extract.ts`): when step 3 fails, parse
   inline `<style>` + up to 3 linked stylesheets (≤300 KB each, same SSRF
   rules): Shopify Dawn-style `--color-*` custom properties on `:root`/`body`,
   `<meta name=theme-color>`, then a frequency/saturation pick for the accent.
5. **Logo / favicon / title** (`extract.ts`): og:site_name / `<title>`;
   `apple-touch-icon` > `icon` > `/favicon.ico`; logo from header `<img>`
   with `logo` in src/alt/class, or `og:image` as last resort. Absolute URLs.
6. **Products** (`products.ts`): Shopify → `GET /products.json?limit=8`
   (title, first image, `variants[0].price` formatted with the store's
   currency if discoverable, else `$`). Otherwise JSON-LD `Product` /
   `ItemList`. Max 8. Same SSRF rules.
7. **Theme finishing** (`theme.ts`): normalise to hex, derive `accentText` by
   contrast, `surface` from background, `muted` from text, `border` from
   background; clamp radius 0–24. `themeSource` records which stage won.
8. **Cache** (`cache.ts`): in-memory `Map` keyed by host, 1 h TTL, max 50
   entries. Also mirror to `os.tmpdir()/growmerce-preview/<host>.json` so dev
   workers share. Cache successes only.
9. **Rate limit** in the route: 10 preview jobs / IP / 10 min, in memory.

Nothing in this pipeline may log the visitor's email.

## Pages (`src/app/try/`)

- `/try` — lead form. Store domain input (accepts `mystore.com`,
  `https://mystore.com/collections/all`, `mystore.myshopify.com`; normalises
  client-side to show what we understood), email input, one primary button.
  Client validation mirrors the server. Submit: POST `/api/trial-lead` →
  on `ok` with `token`, submit the hidden demo-store form (new tab), then
  `router.push('/try/preview?store=…&t=…')`. If the lead call fails or comes
  back without a token, go to the preview page anyway with what we have and
  let it show the "couldn't reach" state — never strand the visitor.
- `/try/preview` — reads `store` + `t`, POSTs to `/api/preview` once, shows a
  4-step progress list while waiting, then renders:
  - a browser-chrome frame holding the screenshot (or the synthesised
    storefront when null) with the **Growsearch widget** over it;
  - a side card: "Your demo store is open in another tab" + the password +
    an "Open it again" button (same hidden-form trick) + "Get my custom
    plan" → `/pricing`;
  - a short line saying what was matched ("Colours matched from your live
    styles" / "…from your stylesheet" / "We used default colours").
  `robots: { index: false }`. Handles a missing/invalid token by sending the
  visitor back to `/try` with the store prefilled.
- `GrowsearchWidget` — a real-DOM version of the mock in
  `public/img/demos/rainy-commute.webp`: search bar with a typed query,
  assistant column ("Which option best matches …?", "Showing N products."),
  product grid (their products, or tasteful placeholders), "See all results"
  footer. All colour via CSS variables from `PreviewTheme`. Must look right on
  a dark-themed store as well as a light one.

Design language: the site's existing tokens and utilities (`cta-primary`,
`font-poppins`/`font-bricolage`, `bg-cream`, `text-body-mute`, `Reveal`,
`hero-enter`). Read `src/app/pricing/page.tsx`, `src/app/fit/page.tsx` and
`src/components/site/DemoStoreButton.tsx` for the voice and the shapes.
