"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

/* Each conviction carries the mock that demonstrates it, so the empty half of
   the card does some work. The examples in the copy are the same queries the
   demos on this site actually run. */
const ITEMS = [
  {
    title: "Intent, not keywords",
    body:
      "Shoppers type sentences, not search terms. \u201CSomething warm for a rainy commute\u201D, \u201Clinen shirt but not white\u201D \u2014 price, attribute and intent get read straight out of the sentence. No filter menus to dig through, and no teaching your customer how to talk to your store.",
    media: "/img/demos/rainy-commute.webp",
    alt: "A search for \u201Csomething warm for the rainy commute\u201D returning scarves, beanies and an umbrella",
  },
  {
    title: "It only talks about what you actually stock",
    body:
      "The model never invents a product, a price or a promise. Every answer is grounded in your live catalogue \u2014 real SKUs, real stock, real prices, synced from Shopify as they change \u2014 so there is nothing for it to be confidently wrong about.",
    media: "/img/demos/tech-suggestions.webp",
    alt: "Storefront results showing live stock and pricing, including a sold-out product and reduced prices",
  },
  {
    title: "Speed is part of the answer",
    body:
      "An assistant that thinks for four seconds has already lost the sale. Your native results appear instantly, then AI ranking and semantic matches layer in on top of them. The shopper never sits watching a spinner while a model makes up its mind.",
    media: "/img/demos/beauty-suggestions.webp",
    alt: "A storefront search panel already showing suggestions and products before anything has been typed",
  },
  {
    title: "If it doesn\u2019t sell, it\u2019s decoration",
    body:
      "Every AI decision is tied back to a checkout. Search-attributed revenue, add-to-cart rate, zero-result rate, and the questions shoppers actually asked \u2014 all measured in the open, so you can judge the AI on money rather than on vibes.",
    media: "/img/demos/linen-shirt.webp",
    alt: "Search results with an add-to-cart on every product, the step the analytics attribute back to the query",
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
              key={item.media}
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
                    <div className="relative mb-4 aspect-[1386/1135] overflow-hidden rounded-[18px] bg-peach/40 lg:hidden">
                      <Image
                        src={item.media}
                        alt={item.alt}
                        fill
                        sizes="92vw"
                        className="object-cover"
                      />
                    </div>
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
