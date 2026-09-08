import type { ReactNode } from "react";
import Arrow from "./Arrow";
import { SHOPIFY_APP_LISTING } from "@/lib/site-urls";

/**
 * Sends the visitor to our Shopify App Store listing.
 *
 * A plain `<a>` on purpose: this is a navigation, not a gate, so there is
 * nothing to hydrate and nothing to block. The destination is
 * `SHOPIFY_APP_LISTING` — the one place the URL lives — and this is the one
 * component that reads it.
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
}: {
  className?: string;
  children?: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={SHOPIFY_APP_LISTING}
      target="_blank"
      rel="noopener noreferrer"
      className={`${variant === "primary" ? "cta-primary" : "cta-secondary"}${
        className ? ` ${className}` : ""
      }`}
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
