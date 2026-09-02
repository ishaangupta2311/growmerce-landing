export const GROWMERCE_HOME = "https://growmerce.ai/";
export const GROWSEARCH_HOME = "https://search.growmerce.ai/";
export const GROWSEARCH_FEATURES = "https://search.growmerce.ai/features";

/**
 * Where "See demo" should land: the reel grid, not the top of the features
 * page. The anchor is on the "What your shoppers get" section in
 * src/app/growsearch/features/page.tsx — move the id and this follows.
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
