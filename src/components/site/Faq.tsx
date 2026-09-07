"use client";

import { useState } from "react";

import type { FaqItem } from "@/lib/faqs";

export default function Faq({
  items,
  className,
  id = "faq",
}: {
  items: FaqItem[];
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby="faq-title"
      className={`mx-auto max-w-[1370px] scroll-mt-28 px-6 py-20 lg:py-28 ${className ?? ""}`}
    >
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <h2
          id="faq-title"
          className="font-bricolage text-[clamp(3rem,6vw,6.75rem)] leading-[0.95] font-semibold tracking-tight lg:text-[clamp(4rem,7vw,7.25rem)]"
        >
          <span className="block">Frequently</span>
          <span className="block">asked</span>
          <span className="block w-fit rounded-[18px] bg-brand px-5 pb-1 text-white">
            Questions
          </span>
        </h2>

        <FaqList items={items} />
      </div>
    </section>
  );
}

/**
 * The accordion itself, without the page furniture around it. The help centre
 * stacks several of these under their own headings; a page's FAQ section wraps
 * one in the big "Frequently asked Questions" block below. One accordion, two
 * places, so they cannot drift apart.
 */
export function FaqList({ items, className }: { items: readonly FaqItem[]; className?: string }) {
  const [open, setOpen] = useState(0);

  return (
    <ul className={`space-y-3.5 ${className ?? ""}`}>
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
  );
}
