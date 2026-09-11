export type FaqItem = { q: string; a: string };

/**
 * Every question the site answers, in one file.
 *
 * Each page renders its own set and the help centre renders all of them, so
 * the two cannot drift: there is one copy of each answer and the grouping
 * below is the only thing that decides where it appears.
 */

/* Figma repeats a placeholder "What is GrowSearch?"; these are the real ones. */
const HOME_FAQ: FaqItem[] = [
  {
    q: "What is Growsearch, and how is it different from Shopify's native search?",
    a: "Growsearch replaces your store's default search bar with one that understands full sentences, not just keywords. Shoppers can ask for \"skincare under $10\" or \"warm but not bulky\" and get real, in-stock products back — something Shopify's built-in search can't do — and you get analytics showing exactly which searches turned into checkouts.",
  },
  {
    q: "What happens when a shopper searches for something you don't stock?",
    a: "Never a dead end. Typos get corrected, intent gets read, and the nearest real shelf gets offered instead of an empty page — \"we don't have Kava drinks, but you might like these Kratom Seltzers.\" Every zero-result term is also logged as a buying list for you.",
  },
  {
    q: "Does Growsearch replace my Shopify search bar, or run alongside it?",
    a: "It replaces the search bar itself; shoppers use the exact box they always have, now running on Growsearch instead of Shopify's keyword matching. Your theme, checkout, and catalog stay exactly where they are.",
  },
  {
    q: "Is Growsearch an AI shopping assistant, or just a search upgrade?",
    a: "Both, in one bar. Shoppers can search normally or ask a full question and get an assistant-style answer grounded in your real stock, with no separate chat window to open.",
  },
  {
    q: "How long does setup take?",
    a: "Install from the Shopify App Store, and the search bar matches your existing theme automatically — nothing to design. Your catalog indexes itself from Shopify webhooks and stays current as products change. No replatforming, no developer, no six-week onboarding.",
  },
  {
    q: "How do I know it's actually making me money?",
    a: "Because it reports on itself. You see search-attributed checkouts, add-to-cart rate from results, click-through rate, zero-result rate, and full query-to-purchase journey replays, so the AI is judged on revenue.",
  },
  {
    q: "How is Growsearch different from Klevu or Searchspring?",
    a: "Growsearch is built for stores that want AI search live in minutes, not a re-platforming project: flat pricing from $49/month, install straight from the Shopify App Store, no revenue share, and no seat minimums. Klevu and Searchspring serve larger, more complex catalogs and price accordingly.",
  },
  {
    q: "What does it cost, and can I try it first?",
    a: "Plans start at $49/month, and every plan includes a 15-day free trial, no credit card required. Pricing is a simple monthly number you can cancel, with no revenue share and no seat minimums.",
  },
];

const GROWSEARCH_FAQ: FaqItem[] = [
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

const FEATURES_FAQ: FaqItem[] = [
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

const SOLUTIONS_FAQ: FaqItem[] = [
  {
    q: "Does Growsearch replace my Shopify search or sit on top of it?",
    a: "It sits on top. Your native results still render instantly — Growsearch layers intent matching, recovery and ranking over them, so the shopper never waits on a model and nothing breaks if the AI has an off day.",
  },
  {
    q: "We already have a filter app. Is this the same thing?",
    a: "No. Filters make the shopper do the work of narrowing. Growsearch reads the narrowing out of their sentence, and lets them keep adjusting it in conversation — “only under $20”, “actually show me sunscreens instead”.",
  },
  {
    q: "How quickly would we see whether it helped?",
    a: "Within the trial. Zero-result rate and search-attributed checkouts are visible from day one, so the comparison is against your own store's numbers rather than a case study.",
  },
  {
    q: "What about stores with huge or messy catalogues?",
    a: "That's the case it's built for. Metafields and custom attributes are indexed, out-of-stock items are ranked down rather than hidden, and drafts and archived products are excluded.",
  },
];

const PRICING_FAQ: FaqItem[] = [
  {
    q: "Is there really a free trial?",
    a: "Yes — 14 days on every plan, no credit card required. You install Growsearch, point it at your catalogue and watch what your own shoppers search for before you decide anything.",
  },
  {
    q: "What counts as a search?",
    a: "One shopper query against your storefront. Follow-up refinements in the same conversation — “only under $20”, “show me sunscreens instead” — are part of that session, not new searches, so a browsing shopper doesn't burn your allowance.",
  },
  {
    q: "What happens if I go over my plan's searches?",
    a: "Search keeps working — we never switch your storefront off mid-month. We'll flag that you're trending over and suggest the tier that fits; if it was a one-off spike, nothing changes.",
  },
  {
    q: "Monthly or yearly — what's the difference?",
    a: "Only the price. Yearly saves between 7% and 15% depending on the tier; the product is identical. Start monthly if you want to stay light on your feet.",
  },
  {
    q: "Can I cancel, and do you take a cut of revenue?",
    a: "Cancel any time from your dashboard, and no — there is no revenue share and no per-seat pricing. A flat monthly number you can predict, which is the whole point.",
  },
];

const ABOUT_FAQ: FaqItem[] = [
  {
    q: "So what is Growmerce, exactly?",
    a: "An ecommerce AI studio. We own, build and operate the tools ourselves rather than reselling somebody else's model — Growsearch today, more to follow once each one has paying customers.",
  },
  {
    q: "Why only one product?",
    a: "Because a half-built suite helps nobody. Growsearch has to earn its place with real stores before the second tool gets any engineering time. That's a deliberate constraint, not a stage we're embarrassed about.",
  },
  {
    q: "Who is behind it?",
    a: "It's founder-led and serves stores globally. The person who writes the code is the person who answers your demo call — which is an advantage while we're small, and we intend to keep it as long as possible.",
  },
  {
    q: "What's next after Growsearch?",
    a: "Whatever the searches tell us. The zero-result terms and shopper questions Growsearch collects are the best product roadmap we could ask for — so the next tool will come out of real customer behaviour, not a brainstorm.",
  },
  {
    q: "How do I get in touch?",
    a: "Drop your store URL in the form above, and we'll come back with a teardown of the three workflows most likely costing you hours, before any call.",
  },
  {
    q: "Does Growmerce sell or share shopper data?",
    a: "No. Growmerce does not sell or share shopper data. Growsearch uses the information needed to make search work and report on its revenue, and your store's data stays tied to your store.",
  },
];

const FIT_FAQ: FaqItem[] = [
  {
    q: "How small is too small a catalogue?",
    a: "There is no hard number, but under roughly a hundred products a shopper can usually reach anything from your menus in two clicks, and search never becomes the path they take. The better signal is your own search volume: if the bar is barely used, fix that first — Growsearch makes search better, it does not make people start using it.",
  },
  {
    q: "How do I tell whether search actually drives my sales?",
    a: "Shopify reports on it. Compare the conversion rate of sessions that used search against sessions that did not — searchers usually convert several times better. If the gap is wide and the share of searching sessions is meaningful, search is a lever. If almost nobody searches, it is not.",
  },
  {
    q: "We are on WooCommerce, not Shopify. Can we use it?",
    a: "Not yet. Growsearch installs as a Shopify app today and WooCommerce is next on the roadmap — so for now the honest answer for a Woo store is to wait.",
  },
  {
    q: "What if we're not sure and want a second opinion?",
    a: "Say so. Send us your storefront and roughly what share of sessions use search, and we will tell you if it is not worth your money — we would rather lose the sale than have you cancel in month two.",
  },
  {
    q: "If we are a fit, how do we find out for certain?",
    a: "Run the 14-day trial on your own catalogue. Zero-result rate and search-attributed checkouts show up from day one, so the answer comes from your own store's numbers rather than from us.",
  },
];

const COMPARE_FAQ: FaqItem[] = [
  {
    q: "Do I have to replace my existing search app?",
    a: "Only if it is doing the same job. Growsearch installs alongside your theme and takes over the search bar; if you are running a filter or merchandising app that does something else, it stays. What you should not do is run two things both claiming the search results — pick one.",
  },
  {
    q: "How is this different from adding an AI chatbot?",
    a: "A chatbot sits beside the storefront and answers questions. Growsearch is inside the results — it reads the query, ranks the catalogue, recovers the dead ends and reports what the searches earned. Shoppers never have to notice they are talking to anything.",
  },
  {
    q: "Recommendation apps already lift my AOV. Why add search?",
    a: "They work on shoppers who are already looking at something. Search is the shopper who told you exactly what they wanted before you showed them anything — and it is the one place a wrong answer ends the session instead of shaping it.",
  },
  {
    q: "Can I compare it against what I have now?",
    a: "That is the intended way to buy it. The 14-day trial runs on your own catalogue, and zero-result rate and search-attributed checkouts are visible from day one, so the comparison is against your store's own numbers rather than anyone's marketing page — including this one.",
  },
  {
    q: "What if my catalogue is messy?",
    a: "Metafields and custom attributes are indexed, out-of-stock products are ranked down rather than hidden, and drafts and archived products are excluded. Messy catalogues are where the gap between keyword matching and intent is widest.",
  },
];

/**
 * The help centre's running order. `href` points at the page the set belongs
 * to, so a reader who wants the argument around an answer can go and get it.
 */
export const HELP_TOPICS = [
  {
    id: "start",
    title: "Getting started",
    blurb: "What Growsearch is, what it costs, and what happens after you install it.",
    href: "/",
    hrefLabel: "Home",
    items: HOME_FAQ,
  },
  {
    id: "growsearch",
    title: "Growsearch",
    blurb: "The product itself — what it does to a query and what it does with the result.",
    href: "/growsearch",
    hrefLabel: "Growsearch",
    items: GROWSEARCH_FAQ,
  },
  {
    id: "features",
    title: "Features in detail",
    blurb: "Conversation, add-to-cart, ranking speed and what the dashboard reports.",
    href: "/growsearch/features",
    hrefLabel: "All features",
    items: FEATURES_FAQ,
  },
  {
    id: "solutions",
    title: "The problem it solves",
    blurb: "Where a keyword index loses you money, and how this sits on top of it.",
    href: "/solutions",
    hrefLabel: "Solutions",
    items: SOLUTIONS_FAQ,
  },
  {
    id: "compare",
    title: "Compared with the alternatives",
    blurb: "Native search, recommendation apps, AI plugins, and running them together.",
    href: "/compare",
    hrefLabel: "Compare",
    items: COMPARE_FAQ,
  },
  {
    id: "fit",
    title: "Whether it suits your store",
    blurb: "Catalogue size, how much your shoppers search, and which platforms are live.",
    href: "/fit",
    hrefLabel: "Is it a fit?",
    items: FIT_FAQ,
  },
  {
    id: "pricing",
    title: "Pricing and the trial",
    blurb: "What counts as a search, what happens if you go over, and how to cancel.",
    href: "/pricing",
    hrefLabel: "Pricing",
    items: PRICING_FAQ,
  },
  {
    id: "company",
    title: "About Growmerce",
    blurb: "Who builds this, why there is one product, and how to reach us.",
    href: "/about",
    hrefLabel: "About us",
    items: ABOUT_FAQ,
  },
] as const;

export {
  HOME_FAQ,
  GROWSEARCH_FAQ,
  FEATURES_FAQ,
  SOLUTIONS_FAQ,
  PRICING_FAQ,
  ABOUT_FAQ,
  FIT_FAQ,
  COMPARE_FAQ,
};
