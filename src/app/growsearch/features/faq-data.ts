import type { FaqItem } from "@/components/site/Faq";

/* Features-page FAQ — distinct from the /growsearch FAQ, focused on the
   mechanics of the individual features on this page rather than the
   product as a whole. */
export const FEATURES_FAQ: FaqItem[] = [
  {
    q: "Do the filters work through conversation, or do shoppers still click through menus?",
    a: "Both work. Shoppers can click filter chips as usual, or just say “only under $20” and have the assistant apply, combine, or reset filters live — on top of your existing catalogue, with nothing to rebuild.",
  },
  {
    q: "Can shoppers add products to their cart directly from search results?",
    a: "Yes. Add-to-cart works straight from the results panel, and the cart count updates immediately — shoppers never have to leave the search experience to buy.",
  },
  {
    q: "Does the AI slow search down?",
    a: "No. Native results appear instantly; semantic ranking and AI matches layer on top of them a moment later. Shoppers see something on-screen immediately, then it gets smarter.",
  },
  {
    q: "What exactly do I see in the merchant dashboard?",
    a: "Searches and unique visitors, click-through rate, add-to-cart rate, cart-to-purchase conversion, search-attributed checkouts via the Shopify Web Pixel, zero-result rate, average response time, and trending terms — updated continuously.",
  },
  {
    q: "Is the “ten you see” side just vanity metrics?",
    a: "No — every number ties back to a step a shopper actually took, from search to click to cart to checkout, so you can judge the AI on revenue rather than on vibes.",
  },
];
