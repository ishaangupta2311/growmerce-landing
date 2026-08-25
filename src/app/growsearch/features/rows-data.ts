export type FeatureRowData = {
  eyebrow: "SMART FILTERING" | "SHOPPER EXPERIENCE" | "BUYER EXPERIENCE" | "PERFORMANCE" | "MERCHANT INSIGHTS";
  title: string;
  bullets: string[];
  group: "feel" | "see";
  /** Reserved for the product demo GIFs that will replace these placeholders. */
  mediaSrc?: string | null;
};

/*
 * From Figma frame 272:264 ("PERFORMACE" fixed to "PERFORMANCE"). Bullets
 * marked Figma-sourced are copied as given in the brief; the rest were left
 * empty in Figma and are written here from the real feature set (natural-
 * language + conversational filtering, instant add-to-cart, native-then-AI
 * result layering, the analytics Growsearch actually tracks, trending
 * terms, and assistant-question insights).
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
  },
  {
    eyebrow: "MERCHANT INSIGHTS",
    title: "Trends from real behavior, not guesses.",
    bullets: [
      "Trending search terms updated continuously, not on a monthly report",
      "Spot demand shifts before they show up in sales",
      "Nothing to export or stitch together yourself",
    ],
    group: "see",
  },
  {
    eyebrow: "MERCHANT INSIGHTS",
    title: "Understand what shoppers are really asking.",
    bullets: [
      "Insights drawn straight from the questions shoppers ask the assistant",
      "See where the AI's answers helped — and where they didn't",
      "Turn recurring questions into new collections or FAQ content",
    ],
    group: "see",
  },
];
