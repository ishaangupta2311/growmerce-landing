import type { NativeSearch } from "@/lib/preview/types";

/**
 * The store's own search, open and empty — the "before" half of the
 * comparison.
 *
 * A photograph, not a reconstruction. The server clicked the storefront's
 * search control in a real browser, let whatever drawer or modal or field
 * appeared settle, and screenshotted it with nothing typed; this draws that
 * image into the storefront area of the frame, in place of the homepage
 * capture, and draws nothing else. The first version of this panel rendered
 * Shopify's `/search/suggest.json` as our own product cards, and
 * boat-lifestyle.com caught it: they run SearchTap, so no shopper ever sees
 * that endpoint, and it returns six tidy products for a nonsense term, so the
 * panel flattered the very search we are meant to replace. Anything redrawn
 * here — even a search-bar chrome around the image — is a step back toward
 * that, so there is none.
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
 * page rather than our drawing of one, and a reader deserves to be told so —
 * and told what it is. It is an empty box, so the alt says an empty box; a
 * screen reader describing it as "search results" would be the suggest.json
 * lie again, in the accessibility tree.
 */
export default function NativeSearchPanel({
  search,
  store,
  compact = false,
  chromeHeight,
}: {
  search: NativeSearch;
  /** The normalised host, for the alt text. */
  store: string;
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
      {/* Two canvases, two captures, and the phone one is not a nicety.
          Desktop is easy: the shot is the frame's exact size, so `cover` is a
          no-op and the position is inert.
          The phone canvas is 342px against a 1440px capture. No crop of the
          desktop shot survives that — bulk.com's overlay is ~500px wide, so a
          342px window aimed dead at the box still cut off the magnifier, the
          caret and the placeholder, every part that says "search". Tried with
          `cover` (which upscales to ~1146px first, magnifying as well as
          clipping) and with native pixels; both lost it. So the job takes a
          second shot at phone width, where a store serves the search a phone
          shopper actually gets — usually a full-width sheet that fits here
          properly.
          When that pass fails (Skullcandy hides its mobile input off-screen in
          a bar the hamburger does not open) we fall back to cropping the
          desktop shot at the reported focus point. Worse, but still their
          search, which beats an empty panel. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL
          built by the preview job, so there is no remote asset for next/image
          to optimise and no domain to whitelist. */}
      <img
        src={(compact && search.screenshotPhone) || search.screenshot}
        alt={`${store}'s own search box, open and empty, screenshotted in a browser`}
        className="absolute inset-0 size-full object-cover"
        style={
          /* `focus` describes the desktop capture, so it only applies when we
             are actually cropping that one. The phone shot is already the
             right shape and wants the default. */
          compact && search.screenshotPhone ?
            undefined
          : {
              objectPosition: `${Math.round(search.focus.x * 100)}% ${Math.round(search.focus.y * 100)}%`,
            }
        }
      />
    </div>
  );
}
