"use client";

import { useState } from "react";

const GROUPS = [
  {
    name: "Search and discovery",
    items: [
      "Natural-language queries — price, attributes and intent read from the sentence",
      "Conversational refinement: combine, remove or reset filters mid-conversation",
      "Never-zero-results recovery with typo correction and close alternatives",
    ],
  },
  {
    name: "Catalog understanding",
    items: [
      "Metafields and custom attributes indexed",
      "Out-of-stock items ranked down, not hidden",
      "Draft and archived products excluded",
    ],
  },
  {
    name: "Insights and reporting",
    items: [
      "Search-attributed checkouts captured through the Shopify Web Pixel",
      "Click-through, add-to-cart and cart-to-purchase rates per query",
      "Zero-result rate, trending terms and full query-to-purchase journey replay",
    ],
  },
  {
    name: "Setup and support",
    items: [
      "Install from the Shopify App Store — the search bar matches your theme automatically",
      "Catalogue stays current from Shopify product webhooks, with no manual re-indexing",
      "Deep theme-editor customisation, plus founder-led onboarding help",
    ],
  },
];

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="10.5" cy="10.5" r="6.75" stroke="currentColor" strokeWidth="2.2" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function AllPlans() {
  const [active, setActive] = useState(0);

  return (
    <section aria-labelledby="all-plans-title" className="mx-auto max-w-[1370px] px-6 py-20 lg:py-28">
      <h2
        id="all-plans-title"
        className="text-center text-[clamp(1.875rem,3.4vw,3rem)] font-bold text-body-mute"
      >
        All plans include:
      </h2>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        {/* Group selector */}
        <div role="tablist" aria-label="What every plan includes" className="space-y-4">
          {GROUPS.map((g, i) => {
            const on = active === i;
            return (
              <button
                key={g.name}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`plan-group-${i}`}
                id={`plan-tab-${i}`}
                onClick={() => setActive(i)}
                className={`flex w-full items-center gap-3.5 rounded-[14px] px-6 py-4 text-left font-poppins text-[clamp(1.0625rem,1.8vw,1.5rem)] font-bold transition-[background-color,color,transform] duration-200 hover-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  on
                    ? "bg-brand text-white shadow-[0_16px_34px_-18px_rgba(255,90,31,0.9)]"
                    : "border-2 border-brand text-brand"
                }`}
              >
                <SearchGlyph className="size-6 shrink-0" />
                {g.name}
              </button>
            );
          })}
        </div>

        {/* Selected group's list */}
        <div
          role="tabpanel"
          id={`plan-group-${active}`}
          aria-labelledby={`plan-tab-${active}`}
          className="lg:pt-2"
        >
          <ul className="space-y-6">
            {GROUPS[active].items.map((item) => (
              <li key={item} className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-peach text-brand"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[clamp(1.0625rem,1.9vw,1.625rem)] leading-snug">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
