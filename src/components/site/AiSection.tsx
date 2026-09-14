"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

/* Convictions about how we build with AI, not a feature list for Growsearch
   — /growsearch/features already carries those, and repeating them here
   under "AI at Growmerce" made the company sound like one product.

   Each one carries a drawn diagram rather than a storefront screenshot: the
   claims are about how the thing is built, and a picture of six products on
   a shelf argues for none of them. */
const ITEMS = [
  {
    title: "Intent, not keywords",
    body:
      "Shoppers type sentences, not search terms — \"something warm for a rainy commute\" or \"linen shirt but not white.\" Growsearch reads the price, the attribute, and the intent straight out of that sentence. There are no filter menus to dig through, and your customer never has to learn how to talk to your store.",
    media: "/img/pages/ai-not-a-chatbot.svg",
    alt: "A shopper's natural-language intent being understood by the search experience",
  },
  {
    title: "Grounded in your data, or it doesn\u2019t ship",
    body:
      "Every answer we return is tied to something you actually have in your catalog — real SKUs, real stock, real prices, synced from Shopify as they change. If the model can't point to an actual record, it can't say it. We would rather return nothing than return something invented.",
    media: "/img/pages/ai-grounded.svg",
    alt: "Product data feeding into one grounded search answer",
  },
  {
    title: "It joins the store you already run",
    body:
      "There's no replatforming, no migration, and no six-week onboarding process. Growsearch installs onto the stack you already have and adapts to your theme, your catalog, and your workflow, instead of asking you to rebuild around ours. If a tool needs a project plan before it does anything useful, it isn't finished yet.",
    media: "/img/pages/ai-installs.svg",
    alt: "Growsearch fitting into an existing storefront",
  },
  {
    title: "Speed is part of the answer",
    body:
      "An AI assistant that takes four seconds to think has already lost the sale. Your native search results appear instantly, and AI ranking and semantic matches layer in right on top of them, so your shopper is never sitting there watching a spinner while a model makes up its mind.",
    media: "/img/pages/ai-measured.svg",
    alt: "Fast search results appearing before deeper AI refinement",
  },
  {
    title: "Judged on revenue, not on vibes",
    body:
      "Every AI decision we make reports on itself in the open — what it was asked, what it returned, and whether that ended in a checkout. We track search-attributed revenue, add-to-cart rate, and zero-result rate so you can judge the AI on revenue, not on a demo.",
    media: "/img/pages/ai-measured.svg",
    alt: "A search journey measured from query to checkout",
  },
];

export default function AiSection() {
  const [open, setOpen] = useState(0);
  /* Tracked separately from `open` so collapsing every row leaves the last
     image up rather than emptying half the card. */
  const [shown, setShown] = useState(0);

  return (
    <section id="service" className="mx-auto max-w-[1440px] px-6 py-24">
      <Reveal>
      <div className="grid items-center gap-10 rounded-[40px] bg-white px-8 py-14 shadow-glow-lg sm:px-14 lg:min-h-[616px] lg:grid-cols-2 lg:rounded-[63px]">
        {/* The half the design left open, now carrying the mock for whichever
            conviction is expanded. Stacked and cross-faded so the space never
            blanks mid-swap.

            Desktop only: in one column this sits above the list, so opening
            the fourth conviction changes a picture the reader has already
            scrolled past. On a phone the mock goes inside the panel it
            belongs to instead. */}
        <div className="relative -mx-2 mb-10 hidden aspect-[1386/1135] overflow-hidden rounded-[24px] bg-peach/40 lg:mx-0 lg:mb-0 lg:mr-10 lg:block">
          {ITEMS.map((item, i) => (
            <Image
              key={item.title}
              src={item.media}
              alt={i === shown ? item.alt : ""}
              fill
              sizes="(min-width: 1024px) 44vw, 92vw"
              className="object-cover transition-opacity duration-500 ease-out"
              style={{ opacity: i === shown ? 1 : 0 }}
            />
          ))}
        </div>

        <div>
          <h2 className="text-[clamp(1.875rem,3vw,2.5rem)] font-semibold">
            AI at Growmerce
          </h2>
          <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-body-mute">
            Every tool we ship runs on the same few convictions about where AI
            belongs in a store &mdash; and where it doesn&rsquo;t.
          </p>

          <ul className="mt-8">
            {ITEMS.map((item, i) => (
              <li key={item.title} className="border-b border-black/10">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(open === i ? -1 : i);
                    setShown(i);
                  }}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between py-4 text-left text-xl transition-colors hover:text-brand"
                >
                  {item.title}
                  <span
                    className={`text-2xl leading-none text-brand transition-transform duration-300 ${
                      open === i ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <Image
                      src={item.media}
                      alt={item.alt}
                      width={720}
                      height={590}
                      sizes="92vw"
                      className="mb-4 h-auto w-full rounded-[18px] bg-peach/40 lg:hidden"
                    />
                    <p className="pb-5 text-sm leading-[27px]">{item.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href={GROWSEARCH_HOME}
            className="cta-primary mt-12"
          >
            See it running in Growsearch
            <Arrow className="cta-arrow" />
          </Link>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
