/**
 * What Growsearch replaces on a storefront.
 *
 * This sits on the Growsearch features page, so it is about the search bar —
 * not the supplier-to-storefront pipeline the Growmerce platform covers. Every
 * line below is a claim the rest of the site already makes: the comparison
 * table on /solutions, the capability tabs on /growsearch, and the twenty
 * feature rows further down this page.
 */
export type Capability = {
  id: string;
  /** What a store would otherwise bolt on. */
  replaces: string;
  label: string;
  detail: string;
};

export const CAPABILITIES: Capability[] = [
  {
    id: "language",
    replaces: "Keyword search",
    label: "Natural language",
    detail: "Reads the sentence, not the keywords",
  },
  {
    id: "recovery",
    replaces: "Synonym lists",
    label: "Typos and synonyms",
    detail: "Corrected before results render",
  },
  {
    id: "filters",
    replaces: "Filter apps",
    label: "Conversational filters",
    detail: "Narrowing read out of the question",
  },
  {
    id: "alternatives",
    replaces: "Recommendation apps",
    label: "Close alternatives",
    detail: "Ranked down when stock runs out, never hidden",
  },
  {
    id: "analytics",
    replaces: "Search analytics add-ons",
    label: "Search analytics",
    detail: "Search-attributed checkouts, tracked to the product",
  },
];

/** Queries the bar types out. All appear elsewhere on the site. */
export const SAMPLE_QUERIES = [
  "linen shirt but not white",
  "something warm for a rainy commute",
  "gift for someone who has everything",
  "kava drinks",
];
