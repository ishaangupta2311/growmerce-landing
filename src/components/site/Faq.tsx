"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

/* Figma repeats a placeholder "What is GrowSearch?"; these are the real ones. */
export const HOME_FAQ: FaqItem[] = [
  {
    q: "What is Growsearch?",
    a: "Growsearch replaces your store's search bar with one that understands sentences instead of keywords. Shoppers can ask for “skincare under $10” or “warm but not bulky” and get real, in-stock products back — and you get analytics showing exactly which searches turned into checkouts.",
  },
  {
    q: "What happens when a shopper searches for something you don't stock?",
    a: "Never a dead end. Typos get corrected, intent gets read, and the nearest real shelf gets offered instead of an empty page — “we don't have kava drinks, but you might like these Kratom Seltzers.” Every zero-result term is also logged for you as a buying list.",
  },
  {
    q: "How long does setup take?",
    a: "Install from the Shopify App Store and the search bar matches your existing theme automatically, so there's nothing to design. Your catalogue indexes itself from Shopify webhooks and stays current as products change. No replatforming, no developer, no six-week onboarding. WooCommerce is next.",
  },
  {
    q: "How do I know it's actually making me money?",
    a: "Because it reports on itself. You see search-attributed checkouts, add-to-cart rate from results, click-through rate, zero-result rate and full query-to-purchase journey replays — so the AI is judged on revenue, not on vibes.",
  },
  {
    q: "What does it cost, and can I try it first?",
    a: "Plans start at $49/month and every plan includes a 15-day free trial with no credit card required. Pricing is a simple monthly number you can cancel — no revenue share and no seat minimums.",
  },
];

export default function Faq({
  items,
  className,
  id = "faq",
}: {
  items: FaqItem[];
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(0);

  return (
    <section
      id={id}
      aria-labelledby="faq-title"
      className={`mx-auto max-w-[1370px] scroll-mt-28 px-6 py-20 lg:py-28 ${className ?? ""}`}
    >
      <div className="grid gap-10 lg:items-stretch lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <h2
          id="faq-title"
          className="text-[clamp(3rem,6vw,6.75rem)] leading-[1.05] font-semibold tracking-tight lg:flex lg:h-full lg:flex-col lg:justify-between"
        >
          <span className="block">Frequently</span>
          <span className="block">asked</span>
          <span className="block w-fit rounded-[18px] bg-brand px-5 pb-1 text-white">
            Questions
          </span>
        </h2>

        <ul className="space-y-3.5">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-[20px] bg-[#f5f5f5] transition-colors duration-200 data-[open=true]:bg-cream"
                data-open={isOpen}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="text-[clamp(1.125rem,2.1vw,1.5rem)] leading-snug font-semibold">
                    {item.q}
                  </span>
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}
                  >
                    <path
                      d="m5 14 7-7 7 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[15.5px] leading-relaxed text-body-mute">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
