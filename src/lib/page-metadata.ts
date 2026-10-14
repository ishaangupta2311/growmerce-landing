import type { Metadata } from "next";

/**
 * What a page tells the outside world about itself: the tab title, the search
 * snippet, the canonical address, and the card LinkedIn, X, WhatsApp and Slack
 * draw when someone pastes the link.
 *
 * Next.js merges metadata one key at a time, so a page that sets `openGraph`
 * replaces the root layout's whole object, and one that does not inherits the
 * homepage's title, description and address. Every page that sets a canonical
 * therefore sets its share card here too, from the same three values, so the
 * card cannot name a different page than the one it was shared from.
 *
 * There is no image on purpose. With none, the card is a plain `summary`, which
 * Next fills in for `twitter` from these same values; add an image here and it
 * becomes a large one everywhere at once.
 */

/** The tab title is the page's own, plus this. The root layout uses it too. */
export const TITLE_TEMPLATE = "%s · Growmerce";

/** The share-card fields that do not change from page to page. */
export const SHARED_OPEN_GRAPH = {
  siteName: "Growmerce",
  type: "website",
} as const;

/**
 * `path` is the page's canonical address: a path on the main site, or the full
 * address for a page that lives on another host. It is used as given for both
 * the canonical link and `og:url`; a query string on the address someone
 * actually visits never reaches either.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...SHARED_OPEN_GRAPH,
      /* The card repeats the tab title, suffix and all: `openGraph.title` is
         not run through the layout's template, and WhatsApp shows no site
         name, so a bare "Pricing" would not say whose pricing it is. */
      title: TITLE_TEMPLATE.replace("%s", title),
      description,
      url: path,
    },
  };
}
