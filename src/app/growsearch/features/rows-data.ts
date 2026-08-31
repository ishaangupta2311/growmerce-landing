export type FeatureRowData = {
  eyebrow: "SMART FILTERING" | "SHOPPER EXPERIENCE" | "BUYER EXPERIENCE" | "PERFORMANCE" | "MERCHANT INSIGHTS";
  title: string;
  bullets: string[];
  group: "feel" | "see";
  /**
   * Base path of this row's demo clip. One value names all three files the
   * encode produces: `<base>.av1.mp4`, the `<base>.mp4` fallback, and the
   * `<base>.jpg` poster. Rows without one show a placeholder.
   */
  videoSrc?: string;
};

/*
 * From Figma frame 272:264 ("PERFORMACE" fixed to "PERFORMANCE"). Bullets
 * marked Figma-sourced are copied as given in the brief; the rest were left
 * empty in Figma and are written here from the real feature set (natural-
 * language + conversational filtering, instant add-to-cart, native-then-AI
 * result layering, the analytics Growsearch actually tracks, trending
 * terms, and the ranked opportunities panel).
 *
 * Rows are grouped to back up the hero's "ten your shoppers feel / ten you
 * see" split: six shopper-facing rows, four merchant-facing ones.
 */
export const FEATURE_ROWS: FeatureRowData[] = [
  {
    eyebrow: "SMART FILTERING",
    title: "Shop the way people actually talk.",
    bullets: [
      "Understands price, attributes, and intent in plain language",
      "Handles vague or loosely-worded queries",
      "Filters combine, adjust, or reset instantly",
    ],
    group: "feel",
    videoSrc: "/video/plain-language",
  },
  {
    eyebrow: "SMART FILTERING",
    title: "One search, endless refinement.",
    bullets: [
      "Combine, remove, or reset filters without losing your place",
      "Ask a follow-up instead of starting a new search",
      "Works on top of your existing catalogue — nothing to rebuild",
    ],
    group: "feel",
    videoSrc: "/video/endless-refinement",
  },
  {
    eyebrow: "SHOPPER EXPERIENCE",
    title: "Never a dead end.",
    bullets: [
      "No typos, no gaps, no empty search bar — shoppers always land on something they can buy",
      "Recovers from typos and out-of-stock automatically",
      "Suggests close alternatives",
    ],
    group: "feel",
    videoSrc: "/video/never-a-dead-end",
  },
  {
    eyebrow: "BUYER EXPERIENCE",
    title: "Close enough is still useful.",
    bullets: [
      "When the exact product isn't there, shoppers see relevant alternatives — not a dead page",
      "Related products shown automatically",
      "No generic “no matches found”",
    ],
    group: "feel",
    videoSrc: "/video/close-enough",
  },
  {
    eyebrow: "PERFORMANCE",
    title: "Fast first, smart always.",
    bullets: [
      "Native results appear instantly, before any AI runs",
      "Semantic ranking and AI matches layer in on top, never instead",
      "No spinner while a model makes up its mind",
    ],
    group: "feel",
    videoSrc: "/video/fast-first",
  },
  {
    eyebrow: "SMART FILTERING",
    title: "Let the assistant do the narrowing.",
    bullets: [
      "Shoppers hand off the filtering to the assistant instead of clicking through menus",
      "“Only under $20” → results filtered live",
      "Works on top of any existing search",
    ],
    group: "feel",
    videoSrc: "/video/assistant-narrowing",
  },
  {
    eyebrow: "MERCHANT INSIGHTS",
    title: "Watch every search, step by step.",
    bullets: [
      "See exactly what shoppers searched, what the AI said, and what they clicked — end to end",
      "Full query-to-purchase journey replay",
      "AI responses shown alongside",
    ],
    group: "see",
  },
  {
    eyebrow: "MERCHANT INSIGHTS",
    title: "See exactly what shoppers want.",
    bullets: [
      "Searches, unique visitors, click-through and add-to-cart rate tracked automatically",
      "Cart-to-purchase conversion and search-attributed checkouts via the Shopify Web Pixel",
      "Zero-result rate and average response time surfaced by default",
    ],
    group: "see",
    videoSrc: "/video/what-shoppers-want",
  },
  {
    eyebrow: "MERCHANT INSIGHTS",
    title: "Trends from real behavior, not guesses.",
    bullets: [
      "Every query ranked by volume, with visitors, zero-results, click rate, carts and purchases beside it",
      "Sixty terms deep, including the questions shoppers put to the assistant",
      "Filter to the searches that returned nothing, across 7, 30 or 90 days",
    ],
    group: "see",
    videoSrc: "/video/top-searches",
  },
  {
    eyebrow: "MERCHANT INSIGHTS",
    title: "It tells you what to fix first.",
    bullets: [
      "Missing products, skipped results and slow queries surfaced as ranked opportunities",
      "“strip” has no exact match, 2 searches — consider adding the product",
      "Sorted into fix first and worth checking, from the last 30 days of search activity",
    ],
    group: "see",
    videoSrc: "/video/search-opportunities",
  },
];
