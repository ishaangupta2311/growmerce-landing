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
    title: "Grounded in your data, or it doesn\u2019t ship",
    body:
      "Every answer is tied to something you actually have \u2014 your catalogue, your reviews, your search logs, what your shoppers actually did. If the model cannot point at a record, it does not get to say it. That rules out a whole class of confident nonsense, and it is why we would rather return nothing than return something invented.",
    media: "/img/pages/ai-grounded.svg",
    alt: "Product data, reviews, searches and customer behaviour feeding into one hub, and out of it a single grounded answer",
  },
  {
    title: "It joins the store you already run",
    body:
      "No replatforming, no migration, no six-week onboarding. What we ship installs onto the stack you have and takes on your theme, your catalogue and your workflow rather than asking you to take on ours. If a tool needs a project plan before it does anything useful, it isn\u2019t finished.",
    media: "/img/pages/ai-installs.svg",
    alt: "A storefront cut into jigsaw pieces with the search field missing, and the Growsearch piece dropping into the gap it fits exactly",
  },
  {
    title: "Judged on revenue, not on vibes",
    body:
      "Every AI decision reports on itself in the open: what it was asked, what it returned, and whether that ended in a checkout. We would rather hand you a number that disappoints than a demo that dazzles \u2014 the only question worth answering is whether the AI paid for itself this month.",
    media: "/img/pages/ai-measured.svg",
    alt: "A dashed trail running from a query to a result, a cart and a checkout, over a rising bar chart",
  },
  {
    title: "A tool that does a job, not a chatbot",
    body:
      "A chat box waiting to be talked to just moves the work onto your customer. We build AI that does its job in the place it belongs \u2014 narrowing a catalogue, rescuing a dead-end search, telling you which queries are losing money \u2014 so nobody has to learn how to talk to it first.",
    media: "/img/pages/ai-not-a-chatbot.svg",
    alt: "An inert chat bubble beside a panel where the list has already been narrowed to the right row",
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
