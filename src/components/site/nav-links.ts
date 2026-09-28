import { GROWSEARCH_DEMO, GROWSEARCH_HOME } from "@/lib/site-urls";

/* Everything the header offers, in one place: the desktop mega menus and the
   mobile sheet both read from here, so a link added or repointed lands in
   both. Icons are the panels' business — each keys its own set by `id`. */

export type MenuLink = {
  id: string;
  label: string;
  note?: string;
  /* Absent until the destination exists. The row still shows — it is part of
     the line-up — but it is not a link and carries no arrow, so it does not
     promise a page that is not there. */
  href?: string;
};

export type PlatformName = "Shopify" | "WooCommerce" | "BigCommerce";
export type PlatformRow = { name: PlatformName; label: string; note: string };

/* No pages yet: each gets its href the day its product page ships. */
export const PRODUCTS: MenuLink[] = [
  { id: "search", label: "AI Powered Product Search", note: "Help customers find the right products" },
  { id: "assistant", label: "AI Shopping Assistant", note: "Personalized shopping experiences" },
  { id: "analytics", label: "Merchant Analytics", note: "Turn data into growth" },
];

export const MORE_PRODUCTS: MenuLink = {
  id: "more",
  label: "See all Growmerce products",
  href: "/solutions",
};

const HOW_IT_WORKS: MenuLink = {
  id: "how",
  label: "How it works",
  note: "See how Growmerce helps you grow",
  href: "/about",
};
const ON_YOUR_STORE: MenuLink = {
  id: "store",
  label: "See it on your store",
  note: "Real examples, real results",
  href: "/try",
};
const BLOGS: MenuLink = {
  id: "blogs",
  label: "Blogs",
  note: "Insights, tips and updates",
  href: "/blog",
};

/* The Growmerce menu closes on webinars; there are none to join yet, so the
   row is listed without a link until there are. */
export const GROWMERCE_EXPLORE: MenuLink[] = [
  HOW_IT_WORKS,
  ON_YOUR_STORE,
  BLOGS,
  { id: "webinar", label: "Webinar", note: "Join live sessions" },
];

export const GROWSEARCH_EXPLORE: MenuLink[] = [
  HOW_IT_WORKS,
  ON_YOUR_STORE,
  BLOGS,
  { id: "video", label: "Video", note: "See it in action", href: GROWSEARCH_DEMO },
];

/* Whether a platform is live comes from PLATFORMS in PlatformStrip, never from
   here — these only say how each menu introduces it. */
export const GROWMERCE_PLATFORMS: PlatformRow[] = [
  { name: "Shopify", label: "Shopify", note: "Seamless Shopify integration" },
  { name: "WooCommerce", label: "Woo Commerce", note: "Power your Woo store" },
  { name: "BigCommerce", label: "Bigcommerce", note: "Built for modern commerce" },
];

export const GROWSEARCH_PLATFORMS: PlatformRow[] = [
  { name: "Shopify", label: "Shopify", note: "Connect your Shopify store" },
  { name: "WooCommerce", label: "WooCommerce", note: "Power your WooCommerce store" },
  { name: "BigCommerce", label: "BigCommerce", note: "Build for bigger commerce" },
];

export const RESOURCE_GROUPS: { title: string; links: MenuLink[] }[] = [
  {
    title: "Learn & Discover",
    links: [
      { id: "learn-started", label: "Getting Started", note: "What Growmerce is and how it works", href: "/about" },
      { id: "learn-blogs", label: "Blogs", note: "Insights, tips and updates", href: "/blog" },
      { id: "learn-videos", label: "Videos", note: "Updates from the build log", href: "/about#updates-title" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { id: "use-started", label: "Getting Started", note: "Start with Growsearch", href: GROWSEARCH_HOME },
      { id: "use-blogs", label: "Blogs", note: "Where store search loses sales", href: "/solutions" },
      { id: "use-videos", label: "Videos", note: "See Growsearch in action", href: GROWSEARCH_DEMO },
      { id: "use-community", label: "Community", note: "The team behind Growmerce", href: "/about" },
    ],
  },
];

/* Figma's Proof column also lists "Feedback"; it returns when there is a page
   of it to link to. "Affiliate program" is Figma's "Partnership program",
   named as the footer names it. */
export const WHY_US_GROUPS: { title: string; links: MenuLink[] }[] = [
  {
    title: "Compare",
    links: [
      { id: "compare", label: "Growmerce Vs Competition", note: "How we stack up against the alternatives", href: "/compare" },
      { id: "fit", label: "Is Growmerce a fit for me?", note: "Where it fits, and where it doesn't", href: "/fit" },
    ],
  },
  {
    title: "Company",
    links: [
      { id: "about", label: "About us", note: "What we build, and why", href: "/about" },
      { id: "affiliates", label: "Affiliate program", note: "Refer stores and get paid", href: "/affiliates" },
    ],
  },
  {
    title: "Proof",
    links: [
      { id: "proof-blogs", label: "Blogs", note: "Insights, tips and updates", href: "/blog" },
      { id: "proof-videos", label: "Videos", note: "See Growsearch in action", href: GROWSEARCH_DEMO },
    ],
  },
];
