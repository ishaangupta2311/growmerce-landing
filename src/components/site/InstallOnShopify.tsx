import type { ReactNode } from "react";
import Arrow from "./Arrow";
import InstallWaitlist from "./InstallWaitlist";
import { SHOPIFY_APP_LISTING, SHOPIFY_LISTING_LIVE } from "@/lib/site-urls";

/**
 * The site's one "Install on Shopify" button, and the one place that decides
 * what pressing it does.
 *
 * Two behaviours, chosen by `SHOPIFY_LISTING_LIVE`:
 *
 *   live      a plain `<a>` to our App Store listing. A navigation, not a
 *             gate, so there is nothing to hydrate and nothing to block.
 *   in review the waitlist panel, because the listing does not exist yet and
 *             sending a merchant to a 404 — or to the App Store's front page —
 *             is worse than telling them the truth and taking their address.
 *
 * The label does not change between the two. A merchant pressing "Install on
 * Shopify" is telling us they want the app on their store, and that is the
 * thing we record either way; the panel says what is actually happening in its
 * own heading, before it asks for anything. What *does* change is the caption
 * each caller prints underneath — see the `SHOPIFY_LISTING_LIVE` branches on
 * the pricing page and in the /try preview, so neither promises a new tab
 * while this opens a form.
 *
 * `variant` covers the two shapes the site already has: bordered next to a
 * louder primary, solid when it is the loudest thing in its block. Both
 * placements today are bordered; the solid is there so a future one does not
 * have to reach past the component for a class name.
 */
export default function InstallOnShopify({
  className,
  children = "Install on Shopify",
  variant = "secondary",
  source = "install-cta",
}: {
  className?: string;
  children?: ReactNode;
  variant?: "primary" | "secondary";
  /** Recorded on the waitlist row, so launch day can tell the placements
      apart. Ignored once the listing is live and this is a plain link. */
  source?: string;
}) {
  const classes = `${variant === "primary" ? "cta-primary" : "cta-secondary"}${
    className ? ` ${className}` : ""
  }`;

  if (!SHOPIFY_LISTING_LIVE) {
    return (
      <InstallWaitlist className={classes} source={source}>
        {children}
      </InstallWaitlist>
    );
  }

  return (
    <a
      href={SHOPIFY_APP_LISTING}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {children}
      {/* The page says "opens in a new tab" in visible copy the way the demo
          store does; this carries the same warning on the link itself, for a
          reader who tabs straight to it and never meets the caption. */}
      <span className="sr-only"> (opens in a new tab)</span>
      <Arrow className="cta-arrow size-5" />
    </a>
  );
}
