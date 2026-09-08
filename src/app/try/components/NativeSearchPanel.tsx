import type { NativeSearch } from "@/lib/preview/types";

/**
 * The store's own search, answering the same question — the "before" half of
 * the comparison.
 *
 * A photograph, not a reconstruction. The server typed `query` into the
 * storefront's own search box in a real browser and screenshotted whatever the
 * store showed a shopper; this draws that image into the storefront area of
 * the frame, in place of the homepage capture, and draws nothing else. The
 * previous version rendered the results as our own product cards, and
 * boat-lifestyle.com caught it: we were quoting a Shopify endpoint their
 * shoppers never touch (they run SearchTap), and that endpoint returns six
 * tidy products for a nonsense term, so the panel flattered the very search
 * we are meant to replace. Anything redrawn here — even a search-bar chrome
 * around the image — is a step back toward that, so there is none.
 *
 * It sits exactly where StoreFrame puts the homepage screenshot: below the
 * chrome bar, inside the 1px border, same corner radius, same cover-and-crop.
 * Toggling therefore swaps one capture for another at identical size and the
 * frame never moves. The frame's numbers are repeated rather than imported
 * because this layer is a sibling of StoreFrame, not a child, and the frame
 * does not export them.
 *
 * The image carries real alt text, unlike the Growsearch widget beside it,
 * which is decorative. This is the one thing on the canvas that is *their*
 * page rather than our drawing of one, and a reader deserves to be told so.
 */
export default function NativeSearchPanel({
  search,
  store,
  query,
  compact = false,
  chromeHeight,
}: {
  search: NativeSearch;
  /** The normalised host, for the alt text. */
  store: string;
  /** Passed in rather than read off `search`, so it is the same binding the
      Growsearch panel gets and the two cannot drift. */
  query: string;
  compact?: boolean;
  /** StoreFrame's chrome-bar height; the capture begins directly under it. */
  chromeHeight: number;
}) {
  /* StoreFrame rounds its outer edge to 20 (14 compact) with a 1px border, so
     the storefront area inside it has a radius one less. */
  const radius = (compact ? 14 : 20) - 1;

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        top: chromeHeight + 1,
        left: 1,
        right: 1,
        bottom: 1,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
        background: "var(--gs-bg)",
      }}
    >
      {/* The phone canvas is tall and narrow, so `cover` has to cut a
          1440-wide capture down to a 430-wide strip. StoreFrame anchors the
          homepage strip top-left because that is where a logo and headline
          live; a results page is laid out the other way round. Its payload —
          the query echoed in the box, the "No results" line or the count, the
          first products — sits in a centred column, and on an engine with a
          facet rail the left edge is nothing but filters. Anchored left, the
          fixture at 390px showed the wordmark, half a search box and no
          answer; anchored centre it shows the answer. Desktop needs no crop
          worth arguing over: the capture is the frame's exact size. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL
          built by the preview job, so there is no remote asset for next/image
          to optimise and no domain to whitelist. */}
      <img
        src={search.screenshot}
        alt={`${store}'s own search results for “${query}”, screenshotted in a browser`}
        className="absolute inset-0 size-full object-cover object-top"
      />
    </div>
  );
}
