import type { CSSProperties } from "react";
import Image from "next/image";
import { Ban, Brain, Search, ShoppingCart, Sparkles, type LucideIcon } from "lucide-react";

/* The Figma stacks four cards that slide over one another as the page
   scrolls, each leaving its eyebrow showing above the next. All four were
   drafted with the same placeholder (a competitor's copy, word for word);
   these are written from what the search actually does, and each shows a
   real query answered in the demo store. The Figma centres the text over a
   full-width shot; on a laptop that leaves the shot too short to read, so
   from lg the text sits beside it instead.

   Each card has its own colour, so the strips left showing read as four
   different things rather than one card drawn four times. */

type Theme = {
  card: string;
  title: string;
  accent: string;
  body: string;
  pill: string;
  query: string;
  note: string;
};

const THEMES: Record<"white" | "peach" | "dark" | "orange", Theme> = {
  white: {
    card: "bg-white ring-1 ring-line/70",
    title: "text-charcoal",
    accent: "text-brand",
    body: "text-body-mute",
    pill: "bg-peach text-brand",
    query: "bg-cream text-charcoal ring-brand/20",
    note: "text-brand",
  },
  peach: {
    card: "bg-[linear-gradient(135deg,#fff4ee_0%,#ffe0cf_100%)] ring-1 ring-brand/10",
    title: "text-charcoal",
    accent: "text-brand",
    body: "text-body-mute",
    pill: "bg-white text-brand",
    query: "bg-white text-charcoal ring-brand/20",
    note: "text-brand",
  },
  dark: {
    card: "bg-charcoal ring-1 ring-white/5",
    title: "text-white",
    accent: "text-[#ff8a5c]",
    body: "text-white/70",
    pill: "bg-white/10 text-white",
    query: "bg-white/10 text-white ring-white/15",
    note: "text-[#ffb18f]",
  },
  orange: {
    card: "bg-[linear-gradient(135deg,#ff5a1f_0%,#ff7c45_100%)]",
    title: "text-white",
    accent: "text-charcoal",
    body: "text-white/90",
    pill: "bg-white/20 text-white",
    query: "bg-white text-charcoal ring-white",
    note: "text-white",
  },
};

type Card = {
  theme: keyof typeof THEMES;
  icon: LucideIcon;
  eyebrow: string;
  title: [string, string];
  body: string;
  query: string;
  note: string;
  image: string;
  alt: string;
};

const CARDS: Card[] = [
  {
    theme: "white",
    icon: Brain,
    eyebrow: "AI-powered search",
    title: ["Understands search ", "intent"],
    body: "Shoppers don't search in your catalogue's words. They type what they mean, and get the scarves, beanies and umbrellas that fit instead of an empty page.",
    query: "something warm for the rainy commute",
    note: "No product is called that. Six found anyway.",
    image: "/img/demos/rainy-commute-panel.webp",
    alt: "Search answering “something warm for the rainy commute” with a scarf, a beanie, an umbrella, a travel mug, gloves and a tote",
  },
  {
    theme: "peach",
    icon: Sparkles,
    eyebrow: "Natural language",
    title: ["Budgets and exclusions, in ", "plain words"],
    body: "Prices, colours and must-nots are read as filters, so the results respect everything the shopper said, including the part that starts with “but”.",
    query: "linen shirt but not white",
    note: "“Not white” means not white.",
    image: "/img/demos/linen-shirt-panel.webp",
    alt: "Search answering “linen shirt but not white” with six linen shirts in green, blue, beige, mauve, mustard and charcoal",
  },
  {
    theme: "dark",
    icon: Ban,
    eyebrow: "Zero results",
    title: ["Never a ", "dead end"],
    body: "Vague queries, typos and products you don't stock still land on something to buy. When there's no exact match, shoppers see the closest ones and why.",
    query: "gift for someone who has everything",
    note: "The vaguest ask, still four good ideas.",
    image: "/img/demos/gifts-panel.webp",
    alt: "Search answering “gift for someone who has everything” with a moon lamp, a scented candle, a smart mug and a zen garden kit",
  },
  {
    theme: "orange",
    icon: ShoppingCart,
    eyebrow: "Add to cart",
    title: ["From search to cart in ", "one click"],
    body: "Every result carries its own Add button, so a shopper who has found it buys it without leaving the search. The assistant stays beside them for the follow-up.",
    query: "kava drinks",
    note: "Found it, added it, still searching.",
    image: "/img/demos/kava-drinks-panel.webp",
    alt: "Search answering “kava drinks” with six kava drinks, each with an Add button and a cart count below",
  },
];

/* How much of each earlier card stays in view: the top padding and the
   eyebrow row, so the next card's edge meets the title exactly. */
const PEEK = "3.5rem";

/* The header is 84px; the stack starts a little below it. Every card is as
   tall as the last one can be and still fit whole under the three peeks
   above it, so none of them ever runs off the bottom of the screen. */
const STACK_STYLE = {
  "--peek": PEEK,
  "--stack-top": "100px",
  "--stack-h": `max(460px, calc(100svh - var(--stack-top) - 3 * var(--peek) - 1.5rem))`,
} as CSSProperties;

/* A loose hand-drawn arrow from the note towards the screenshot. */
function HandArrow({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 60" fill="none" className={className}>
      <path
        d="M4 44 C 30 58, 70 54, 108 18"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M92 16 L 109 16 L 106 33" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FeatureStack() {
  return (
    <section aria-labelledby="stack-title" className="mx-auto max-w-[1460px] px-3 pb-20 sm:px-4 lg:pb-28">
      <h2 id="stack-title" className="sr-only">
        What AI search does for your shoppers
      </h2>
      <ol style={STACK_STYLE} className="grid gap-6 lg:gap-10">
        {CARDS.map((card, i) => {
          const t = THEMES[card.theme];
          const Icon = card.icon;
          return (
            <li
              key={card.eyebrow}
              style={{ "--i": i } as CSSProperties}
              className={`grid gap-8 overflow-hidden rounded-[32px] px-5 pt-5 pb-6 shadow-[0_-24px_48px_-30px_rgba(73,28,8,0.45)] sm:px-9 lg:sticky lg:top-[calc(var(--stack-top)+var(--i)*var(--peek))] lg:h-[var(--stack-h)] lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-12 lg:pb-8 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)] ${t.card}`}
            >
              <div className="flex flex-col">
                {/* Everything an earlier card leaves in view: 20px + 28px + 8px. */}
                <p className="flex h-7 items-center gap-3">
                  <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold tracking-[0.08em] uppercase ${t.pill}`}>
                    <Icon aria-hidden className="size-3.5" strokeWidth={2.4} />
                    {card.eyebrow}
                  </span>
                  <span className={`text-[13px] font-bold tabular-nums ${t.body}`}>
                    0{i + 1} / 0{CARDS.length}
                  </span>
                </p>

                {/* The rest sits in the middle of whatever height is left,
                    so a tall screen spreads the space above and below it
                    rather than opening a gap in the middle of the copy. */}
                <div className="mt-6 flex flex-col lg:mt-0 lg:flex-1 lg:justify-center lg:pb-4">
                  <h3
                    className={`text-[clamp(2rem,3.4vw,3.375rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance ${t.title}`}
                  >
                    {card.title[0]}
                    <span className={t.accent}>{card.title[1]}</span>
                  </h3>
                  <p className={`mt-5 max-w-[44ch] text-[clamp(1rem,1.2vw,1.125rem)] leading-relaxed ${t.body}`}>
                    {card.body}
                  </p>

                  <div className="mt-8">
                    <p className={`text-balance font-hand text-[clamp(1.375rem,1.9vw,1.75rem)] leading-none ${t.note}`}>
                      {card.note}
                      <HandArrow className="ml-2 hidden h-7 w-14 align-[-0.15em] lg:inline-block" />
                    </p>
                    <p
                      className={`mt-3 flex items-center gap-2.5 rounded-[14px] px-4 py-3 text-[15px] font-medium ring-1 ${t.query}`}
                    >
                      <Search aria-hidden className="size-4 shrink-0 opacity-70" strokeWidth={2.4} />
                      <span className="sr-only">Shopper searched: </span>
                      <span className="truncate">{card.query}</span>
                      <span aria-hidden className="-ml-2 h-4 w-px shrink-0 animate-caret bg-current motion-reduce:animate-none" />
                    </p>
                  </div>
                </div>
              </div>

              {/* A browser window around the shot. It starts below the
                  eyebrow row, so the strip an earlier card leaves showing is
                  that row alone, and it shrinks to whichever of the cell's
                  width and height runs out first. */}
              <div className="flex min-h-0 items-center justify-center lg:justify-end lg:pt-9">
                <figure className="flex max-w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_34px_70px_-34px_rgba(23,23,23,0.55)] ring-1 ring-black/5">
                  <div aria-hidden className="flex h-9 shrink-0 items-center gap-1.5 border-b border-line/80 bg-[#faf7f5] px-4">
                    <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="size-2.5 rounded-full bg-[#febc2e]" />
                    <span className="size-2.5 rounded-full bg-[#28c840]" />
                    <span className="mx-auto h-5 w-[min(40%,220px)] rounded-full bg-white ring-1 ring-line" />
                  </div>
                  <Image
                    src={card.image}
                    alt={card.alt}
                    width={1386}
                    height={863}
                    sizes="(min-width: 1024px) 900px, 100vw"
                    className="h-auto w-auto max-w-full lg:max-h-[calc(var(--stack-h)-8rem)]"
                  />
                </figure>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
