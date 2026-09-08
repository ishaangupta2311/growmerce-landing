export const GROWMERCE_HOME = "https://growmerce.ai/";
export const GROWSEARCH_HOME = "https://search.growmerce.ai/";
export const GROWSEARCH_FEATURES = "https://search.growmerce.ai/features";

/**
 * The reel grid, not the top of the features page. The anchor is on the
 * "What your shoppers get" section in src/app/growsearch/features/page.tsx —
 * move the id and this follows.
 *
 * "See demo" no longer points here: it opens the live demo store behind the
 * email gate. This is now only the Resources menu's "Videos" entry.
 */
export const GROWSEARCH_DEMO = `${GROWSEARCH_FEATURES}#demo`;

/**
 * The live Shopify storefront behind "Try it free". It is password-protected,
 * and its root 302s to the password page anyway — so we send visitors straight
 * to the door rather than through the bounce.
 */
export const DEMO_STORE = "https://aryan-dev-store-7x4hu1xc.myshopify.com";
export const DEMO_STORE_ENTRANCE = `${DEMO_STORE}/password`;

/**
 * Not a secret: the whole point is to hand it to the visitor. It lives here so
 * the copy in the modal and the store stay in step when the store rotates it.
 */
export const DEMO_STORE_PASSWORD = "demo";

/**
 * PLACEHOLDER — this is the Shopify App Store home page, not our listing. The
 * Growmerce listing does not exist yet, and this stands in so nothing 404s in
 * the meantime.
 *
 * When the listing goes live, replace the string below with its URL. That is
 * the only line that has to change: every "Install on Shopify" CTA reads this
 * constant through src/components/site/InstallOnShopify.tsx, so the address
 * lives here and nowhere else.
 */
export const SHOPIFY_APP_LISTING = "https://apps.shopify.com/";
