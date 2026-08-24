# Growmerce base design — Figma build spec

Source of truth: Figma file key `H3cxxmCHpTjF2pQmmOBW1w`, page **"full final website"** (`156:3`).
Read frames with the REST API (token supplied in the task brief):

    GET https://api.figma.com/v1/files/H3cxxmCHpTjF2pQmmOBW1w/nodes?ids=<NODE_ID>
    GET https://api.figma.com/v1/images/H3cxxmCHpTjF2pQmmOBW1w?ids=<NODE_ID>&format=png&scale=1

## Page → route → Figma frame

| Page | Route | Frame | Size |
|---|---|---|---|
| Home | `/` | `213:86` "GrowMerce" | 1459×6076 |
| What is Growmerce | `/about` | `269:249` | 1459×7665 |
| Growsearch (product) | `/growsearch` | `160:7` | 1443×7191 |
| Growsearch features | `/growsearch/features` | `272:264` | 1459×7673 |
| Solutions | `/solutions` | `274:293` | 1459×5197 |
| Pricing | `/pricing` | `238:462` | 1443×4275 |

Reference concepts (NOT pages, do not build as routes): `293:343` Curtain Reveal,
`179:10` search-bar, `273:284/295/343` Stack-Containers, `273:279` 3d-layered-frames.

This spec covers the **base design only** — `src/app/page.tsx` and the new routes.
Never touch `src/app/v/**` (those are alternate design variants).

## Brand tokens (already in src/app/globals.css @theme)

| Token | Value | Use |
|---|---|---|
| `brand` / `brand-bright` | `#FF5A1F` | primary CTAs, highlights, headline accents |
| `coral` | `#FF6B35` | secondary accent |
| `charcoal` | `#171717` | headings, nav, body headings |
| white | `#FFFFFF` | page background |
| `cream` | `#FFF4EE` | section/card soft background, nav bar |
| `peach` | `#FFE4D6` | logo strips, banners, decorative borders |
| `body-mute` | `#4A4A4A` | paragraphs |
| `muted` | `#8A8A8A` | supporting text |
| `line` | `#E5E5E5` | dividers, inputs, card borders |

Fonts (already wired in `src/app/layout.tsx`): **Manrope** (`font-sans`, body + most
headings), **Poppins** (`font-poppins`, nav + hero display), **Space Grotesk**
(`font-grotesk`). Figma uses Manrope 700/800 for section headings, Poppins 500 for
nav. Do not add fonts without a reason.

## Shared chrome (build once, import everywhere)

Lives in `src/components/site/`. Page agents MUST import these and MUST NOT edit them.

- `Navbar` — cream bar, logo left (`/brand/logo.svg`), centre links **Platform ▾ ·
  Resources ▾ · Why us ▾ · Pricing**, right **See Demo** (ghost pill) + **Login**
  (outline pill). Dropdown carets are decorative in Figma; implement Platform /
  Resources / Why us as real hover+focus menus linking to the routes above.
- `Footer` — four columns: **Company** (About, Newsroom, Contact us) · **Product**
  (Smart Search, All products) · **Explore more** (Pricing, Coming soon) ·
  **Need help?** (Help center, Getting started, Customer Success); rule, socials
  (LinkedIn/Instagram/X from `/img/icon-*.svg`), `@2026 Growmerce`, `Terms & Privacy`.
- `PlatformStrip` — peach band, logos from `/img/logos/logo-{shopify,bigcommerce,wordpress,woocommerce}.svg`.
- `Faq` — "Frequently asked **Questions**" (Questions in a filled orange block),
  accordion on the right. Takes an `items` prop; one item open by default.
- `CtaPair` — `GET STARTED` (filled orange pill) + a configurable outline pill
  (`SEE ALL OUR PRODUCTS` / `COMPARE WITH COMPETITORS`).
- `ProveItBand` — the "BEFORE WE EVER TALK / Skip the call. We'll do the first hour
  of work" capture band with the store-URL field and `okay, prove it` button.

## Assets on disk

`/brand/logo.svg` · `/img/logos/logo-{shopify,bigcommerce,wordpress,woocommerce}.svg`
`/img/pages/hero-shopping-desk.png` (home hero photo) · `pricing-web.png`
(pricing-band icon web) · `unit-opens.png` (solutions) · `combines-it-all.png`
(features) · `about-screenshot.png`, `about-image2.png` (about) ·
`growsearch-badge.png` · `/img/smart-search-mock.png` (product UI mock) ·
`/img/icon-*.svg` (arrow, sparkle, search-circle, workflow, wallet,
growth-circle, platform, linkedin, instagram, x)

## Conventions

- Next 16.3 App Router, React 19, Tailwind v4, TypeScript. No new npm deps.
- One folder per route: `src/app/<route>/page.tsx` + `components/` beside it for
  page-specific pieces. Export `metadata` per page.
- Content width `max-w-[1370px]`, page padding `px-6`. Match Figma at 1440 and
  degrade to a sensible single column at 390.
- Responsive 390→1440+, semantic headings (one `h1` per page), `focus-visible`
  states, alt text, `prefers-reduced-motion` respected (global rule zeroes
  durations).
- Motion: reuse `Reveal` (`src/components/site/Reveal.tsx`, props `className`,
  `delay`) for scroll reveals and `.hero-enter` / `.hero-enter-scale` for load
  stagger. Transform/opacity only.
- Figma has grey `IMAGE` rectangles and empty blocks in places. Those are
  placeholders: build the real layout and either use a listed asset or a tasteful
  CSS/graphic stand-in. Never render a grey box or the word "IMAGE".

## Content rules

- Fix obvious Figma typos: "Ecomonic"→"Economic", "PRODCUTS"→"PRODUCTS",
  "PERFORMACE"→"PERFORMANCE", "Advance Analytics"→"Advanced Analytics".
- Growmerce is the **umbrella brand**; **Growsearch** is the first product
  (Figma sometimes writes "Smart Search" / "GrowSearch" — normalise to
  **Growsearch**, except keep "Smart Search" where it names the search feature).
- No invented testimonials, customer logos or "our results" numbers. Category
  benchmarks may be cited **with attribution** (Rep AI 10–30% CVR lift;
  iAdvize × Kendra Scott 6×; Bloomreach Loomi +9% CVR / +20% AOV) and must be
  labelled as category benchmarks, not Growmerce results.
- Platform logos (Shopify/BigCommerce/WordPress/WooCommerce) are integration
  targets, not customers — label the strip accordingly ("Works with…").
