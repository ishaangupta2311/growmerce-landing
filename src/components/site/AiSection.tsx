"use client";

import { useState } from "react";
import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";

const ITEMS = [
  {
    title: "Personalization",
    body: "We harness the power of artificial intelligence and machine learning to deliver personalized shopping experiences that resonate with each customer. By analyzing extensive data on user behavior and preferences, our AI-driven products provide tailored recommendations and customizations that enhance customer experiences and drive higher engagement and conversion rates.",
  },
  {
    title: "Real time learning",
    body: "Models retrain continuously on live shopper behavior, so results improve with every session instead of waiting on batch updates.",
  },
  {
    title: "Powerful rule engine",
    body: "Merchandisers stay in control: pin, boost, or bury products with rules that work alongside the AI ranking, not against it.",
  },
  {
    title: "Advanced Analytics",
    body: "See exactly how search and recommendations convert, with click-through, revenue, and trend reporting built in.",
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
            href="#products"
            className="block-cta mt-12 bg-brand-bright text-white"
          >
            Explore all features
            <Arrow className="cta-arrow" />
          </Link>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
