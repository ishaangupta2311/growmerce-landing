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
  /** What the store's own search returns for `query`, or null if we couldn't ask. */
  nativeSearch: NativeSearch | null;
  /** ISO timestamp of when the job ran. */
  fetchedAt: string;
};

/**
 * The store's existing search, answering the same question we do.
 *
 * This is the "before" half of the comparison, and it is only worth showing
 * because it is real: we ask the storefront's own search endpoint and report
 * what came back. An empty `products` array is a genuine answer — usually THE
 * answer, since native search matches keywords and the query is a sentence.
 * When we cannot ask at all the field is null and the UI must say nothing
 * rather than imply a result. Never fabricate this.
 */
export type NativeSearch = {
  /** Echoes `PreviewResult.query`, so a consumer holding only this is not lost. */
  query: string;
  /** What their search returned, capped at 6. */
  products: PreviewProduct[];
  /** Total hits the store reported, when it says; else null. */
  total: number | null;
  /** How we asked, so the UI can be specific about what it is showing. */
  source: "shopify-suggest";
};

export type PreviewErrorCode =
  | "invalid_store"
  | "unauthorized"
  | "rate_limited"
  | "blocked"
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
