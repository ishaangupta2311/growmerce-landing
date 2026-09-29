export const GROWMERCE_HOME = "https://growmerce.ai/";
export const GROWSEARCH_HOME = "https://search.growmerce.ai/";
export const GROWSEARCH_FEATURES = "https://search.growmerce.ai/features";

/**
 * The reel grid, not the top of the features page. The anchor is on the
 * "What your shoppers get" section in src/app/growsearch/features/page.tsx —
 * move the id and this follows.
 *
 * "See demo" no longer points here: it opens the live demo store behind the
 * email gate. This is now only the header menus' "Video" and "Videos" entries.
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
 * Our Shopify App Store listing, published 2026-09-30. Every "Install on
 * Shopify" CTA reads this constant through src/components/site/InstallOnShopify.tsx,
 * so the address lives here and nowhere else.
 */
export const SHOPIFY_APP_LISTING = "https://apps.shopify.com/smarter-search";

/**
 * Whether that listing is something we can actually send a merchant to.
 *
 * While this is false, every "Install on Shopify" opens the waitlist form
 * instead of the App Store — because the button promises an install and there
 * is nothing yet to install, the honest move is to take the merchant's store
 * and address and write to them the day it clears review. Signups land in
 * `marketing.waitlist`; see src/app/api/waitlist/route.ts.
 *
 * Launch day is two edits in this file and nothing else: put the real listing
 * URL above, set this to true. Every CTA becomes a link out again, and the
 * captions beside them change with it — the pricing page and the /try preview
 * both read this constant rather than hard-coding either promise.
 *
 * Typed `boolean` rather than left to infer `false`, so the live branch is not
 * narrowed away as dead code while we wait.
 */
export const SHOPIFY_LISTING_LIVE: boolean = true;

/**
 * Where a plan card's Buy button goes. Plans are bought through Shopify billing
 * only (App Store review 1.2.3), so buying always starts on the App Store: the
 * listing once it is live, and a search for Growsearch before that.
 */
export const PLAN_BUY_URL = SHOPIFY_LISTING_LIVE
  ? SHOPIFY_APP_LISTING
  : "https://apps.shopify.com/search?q=growsearch";

/**
 * Where every pricing link goes. Until the listing is live that is our own
 * /pricing page, which shows the Shopify-billed plans and nothing else; once
 * `SHOPIFY_LISTING_LIVE` flips, every pricing link goes to the listing.
 *
 * App Store review (1.2.3) rejected an Enterprise "custom pricing" block on
 * /pricing that sent merchants to us to arrange a plan directly. Every plan
 * must be bought through Shopify billing, so do not add one back.
 */
export const PRICING_URL = SHOPIFY_LISTING_LIVE ? SHOPIFY_APP_LISTING : "/pricing";
