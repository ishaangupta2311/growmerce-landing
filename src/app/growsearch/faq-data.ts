import type { FaqItem } from "@/components/site/Faq";

/* Product-specific FAQ for /growsearch. Figma repeats a placeholder "What is
   GrowSearch?" for every FAQ slot on the file — these are written fresh for
   this page and are not shared with the home page's FAQ. */
export const GROWSEARCH_FAQ: FaqItem[] = [
  {
    q: "How is Growsearch different from Shopify's default search?",
    a: "Default Shopify search matches keywords. Growsearch reads the sentence — intent, price, attributes and all — so “skincare under $20” or “warm but not bulky” returns real, in-stock products instead of nothing.",
  },
  {
    q: "What happens when a shopper searches for something you don't carry?",
    a: "Growsearch corrects typos, reads intent, and offers the nearest real product instead of an empty results page. Every zero-result term is also logged for you, so you can see what shoppers wanted that you didn't have.",
  },
  {
    q: "Can shoppers refine results just by talking to it?",
    a: "Yes. Shoppers can narrow, switch products or adjust filters through a short AI conversation instead of clicking through menus — “only under $20” filters results live, on top of your existing catalogue.",
  },
  {
    q: "How do I know search is actually making money?",
    a: "Growsearch reports on itself: search-attributed checkouts, add-to-cart rate, click-through rate, zero-result rate, and full query-to-purchase journey replays, all in one dashboard.",
  },
  {
    q: "How long does installation take?",
    a: "Install from the Shopify App Store and the search bar matches your theme automatically. Your catalogue indexes itself from Shopify webhooks and stays current as products change — no developer and no replatform.",
  },
];
