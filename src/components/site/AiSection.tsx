"use client";

import { useState } from "react";
import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";

const ITEMS = [
  {
    title: "Intent, not keywords",
    body:
      "A shopper types a sentence, not a search term. \u201CSkincare under $10\u201D, \u201Cwarm but not bulky\u201D, \u201Cgift, arrives Friday\u201D \u2014 price, attribute, timing and intent get read straight out of the sentence. No filter menus to dig through, no keyword archaeology, and no teaching your customer how to talk to your store.",
  },
  {
    title: "It only ever talks about products you actually stock",
    body:
      "The model never invents a product, a price or a promise. Every answer is grounded in your live catalogue \u2014 real SKUs, real stock, real prices, synced from Shopify as they change \u2014 so there is nothing for it to be confidently wrong about. If we can\u2019t ground a claim in your data, the AI doesn\u2019t make it.",
  },
  {
    title: "Speed is part of the answer",
    body:
      "An assistant that thinks for four seconds has already lost the sale. Your native results appear instantly, then AI ranking and semantic matches layer in on top of them. The shopper never sits watching a spinner while a model makes up its mind.",
  },
  {
    title: "If it doesn\u2019t sell, it\u2019s decoration",
    body:
      "Every AI decision is tied back to a checkout. Search-attributed revenue, add-to-cart rate, zero-result rate, and the questions shoppers actually asked \u2014 all measured in the open, so you can judge the AI on money rather than on vibes.",
  },
];

export default function AiSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="service" className="mx-auto max-w-[1440px] px-6 py-24">
      <Reveal>
      <div className="grid rounded-[40px] bg-white px-8 py-14 shadow-glow-lg sm:px-14 lg:min-h-[616px] lg:grid-cols-2 lg:rounded-[63px]">
        {/* Left half is open space in the design — reserved for imagery. */}
        <div className="hidden lg:block" />

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
                  onClick={() => setOpen(open === i ? -1 : i)}
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
                    <p className="pb-5 text-sm leading-[27px]">{item.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/growsearch"
            className="block-cta mt-12 bg-brand-bright text-white"
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
