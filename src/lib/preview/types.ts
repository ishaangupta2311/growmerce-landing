/**
 * Shared contract for the "Try it free" preview.
 *
 * The flow: a visitor gives us their store's domain and an email on /try. The
 * lead is recorded and a short-lived signed token comes back. The preview page
 * then POSTs { store, token } to /api/preview, which visits the store, reads
 * its theme, takes a screenshot and pulls a few products, and returns this
 * shape. The client renders the Growsearch widget in the store's own colours
 * over that screenshot.
 *
 * Every field except `store`, `theme` and `products` is nullable on purpose:
 * the job degrades step by step (no Chrome → no screenshot but stylesheet
 * colours; not Shopify → no products.json but JSON-LD; nothing parseable →
 * defaults) and the client is expected to render something worthwhile at every
 * level.
 */

export type PreviewPlatform =
  | "shopify"
  | "woocommerce"
  | "bigcommerce"
  | "magento"
  | "other";

export type PreviewTheme = {
  /** Page background, hex like "#ffffff". */
  background: string;
  /** Card / panel background — usually white or a step off `background`. */
  surface: string;
  /** Body text colour. */
  text: string;
  /** Secondary text colour. */
  muted: string;
  /** Primary action colour: the store's main button / brand colour. */
  accent: string;
  /** Text colour that stays readable on `accent` (WCAG-picked #ffffff / #111111). */
  accentText: string;
  /** Hairline / border colour. */
  border: string;
  /** Border radius of the store's primary button, px. */
  radius: number;
  /** A CSS font-family stack seen on headings, or null if unknown. */
  fontFamily: string | null;
};

/** How the theme was obtained — the client can say so, e.g. "matched from your live styles". */
export type PreviewThemeSource = "computed" | "stylesheet" | "default";

export type PreviewProduct = {
  title: string;
  /** Already formatted for display, e.g. "$24.99" or "£12". Null if unknown. */
  price: string | null;
  /** Absolute image URL, or null. */
  image: string | null;
  /** Absolute product URL, or null. */
  url: string | null;
};

export type PreviewResult = {
  /** Normalised host, e.g. "www.allbirds.com". */
  store: string;
  /** Final URL after redirects. */
  url: string;
  /** <title> or og:site_name, trimmed; null if none. */
  title: string | null;
  platform: PreviewPlatform;
  /** Absolute URL of the store's logo image, or null. */
  logo: string | null;
  /** Absolute URL of the best favicon / touch icon, or null. */
  favicon: string | null;
  /**
   * Full-viewport screenshot at 1440×900 as a data URL (image/jpeg, q≈70),
   * or null when no browser was available or the page could not be captured.
   */
  screenshot: string | null;
  theme: PreviewTheme;
  themeSource: PreviewThemeSource;
  /** Up to 8 products; empty array when none could be found. */
  products: PreviewProduct[];
  /**
   * The natural-language phrase both halves of the preview are built around:
   * what the Growsearch mock is answering, and what we typed into the store's
   * own search to get `nativeSearch`. Chosen server-side precisely so the two
   * sides cannot drift apart and make an unfair comparison.
   */
  query: string;
  /** A screenshot of the store's own search box, empty; null if we couldn't open one. */
  nativeSearch: NativeSearch | null;
  /** ISO timestamp of when the job ran. */
  fetchedAt: string;
};

/**
 * What the store's search looks like today — the "before" half of the
 * comparison.
 *
 * A photograph, never a reconstruction, and deliberately not an experiment. We
 * open the storefront's own search the way a shopper does — click the search
 * control, let the drawer or modal or inline field appear — and screenshot it
 * empty. We do not type anything and we do not submit anything.
 *
 * Not running a query is the whole design, and it buys three things. It is
 * honest by construction: an empty box makes no claim about results, so there
 * is nothing to overstate. It always works, because the failure modes that made
 * the previous version return nothing — SearchTap spinning past our wait, a bot
 * challenge fired by submitting, a results page that never rendered — all
 * belong to the submit step we no longer take. And it keeps us from running
 * traffic through a merchant's search engine to make a point about it.
 *
 * What it gives up is worth naming. Asking their search a real question
 * produced the strongest evidence this product can show: sugarcosmetics.com
 * answered "No results found for 'a thoughtful gift for someone on a budget'"
 * and then offered 326 results for "gift" instead — the argument for Growsearch
 * made by the merchant's own storefront. That is gone. The comparison is now
 * look and feel: a plain box that waits for keywords, against an assistant that
 * takes a sentence.
 *
 * So the caption must never suggest we asked their search anything. That would
 * be the same lie the original panel told — it rendered Shopify
 * `/search/suggest.json` results as our own product cards, on a store
 * (boat-lifestyle.com) that runs SearchTap and never touches that endpoint,
 * using an API that returns six products for `zzzqqqxyzzy nonsense term`.
 *
 * `null` means we could not photograph anything: no browser on the machine, or
 * no search control we could find and open. The UI then shows no before-panel,
 * which is now rare rather than routine.
 */
export type NativeSearch = {
  /** Their search UI, open and empty, at 1440x900, as a desktop shopper meets it. */
  screenshot: string;
  /**
   * The same thing at phone width, or null if we could not get one.
   *
   * Not a nicety. The phone canvas is 342px against a 1440px capture, and no
   * crop of a desktop shot survives that: bulk.com's search overlay is ~500px
   * wide, so a 342px window centred on it still cuts off the magnifier, the
   * caret and the placeholder — every part that says "search". Stores also
   * serve a genuinely different search on a phone, usually full-width, which
   * is both what a phone shopper actually sees and what fits this frame.
   */
  screenshotPhone: string | null;
  /**
   * Where the search UI sits in that capture, as fractions of width and height
   * (0–1). The phone canvas shows a ~430px-wide strip of a 1440px shot, so the
   * crop has to be aimed: centred, the strip landed in the middle of an empty
   * field and rendered as two white bands with no search box in them. The
   * client anchors on this instead of guessing a corner.
   */
  focus: { x: number; y: number };
  /** The page the search was opened on. */
  url: string;
  /** How we got it: their own search control, operated the way a shopper would. */
  source: "storefront-search";
};

export type PreviewErrorCode =
  | "invalid_store"
  | "unauthorized"
  | "rate_limited"
  | "blocked"
  | "refused"
  | "unreachable"
  | "timeout"
  | "internal";

export type PreviewError = {
  ok: false;
  error: PreviewErrorCode;
  /** Visitor-facing sentence; safe to render as-is. */
  message: string;
};

export type PreviewResponse = ({ ok: true } & PreviewResult) | PreviewError;

/** POST /api/trial-lead request body. `store` is optional: the "See demo" gate sends email only. */
export type TrialLeadRequest = {
  email: string;
  source: string;
  store?: string;
};

export type TrialLeadResponse =
  | {
      ok: true;
      /** Present only when a valid `store` was supplied. */
      store?: string;
      token?: string;
    }
  /**
   * `rate_limited` is answered with a 429 and a per-IP budget — minting a
   * token is cheap for us but it is the front door to a route that launches
   * browsers. It is a "come back in a minute", not a "you got it wrong", and
   * the form says so rather than sending anyone on to a preview that cannot
   * run.
   */
  | {
      ok: false;
      error: "invalid_body" | "invalid_email" | "invalid_store" | "rate_limited";
    };

/** POST /api/preview request body. */
export type PreviewRequest = { store: string; token: string };

export const DEFAULT_THEME: PreviewTheme = {
  background: "#ffffff",
  surface: "#ffffff",
  text: "#171717",
  muted: "#6b6b6b",
  accent: "#171717",
  accentText: "#ffffff",
  border: "#e5e5e5",
  radius: 8,
  fontFamily: null,
};
