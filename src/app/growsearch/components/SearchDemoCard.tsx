"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ProductTiles from "./ProductTiles";
import styles from "./SearchDemoCard.module.css";

/* Each query is paired with the result panel it actually produces, so the
   panel above the field always answers the question inside it. The panel
   crops are taken below the mock's own search bar — otherwise the card shows
   two search bars, its own and the screenshot's.

   `tiles` are the first three products of that panel. They are what a phone
   shows instead of it; see `ProductTiles`. */
const DEMOS = [
  {
    query: "something warm for a rainy commute",
    src: "/img/demos/rainy-commute-panel.webp",
    count: 6,
    tiles: [
      { name: "Cashmere Scarf", price: "$24.99", img: "scarf" },
      { name: "Knit Beanie", price: "$16.99", img: "beanie" },
      { name: "Travel Umbrella", price: "$18.99", img: "umbrella" },
    ],
  },
  {
    query: "gift for someone who has everything",
    src: "/img/demos/gifts-panel.webp",
    count: 4,
    tiles: [
      { name: "3D Moon Lamp", price: "$9.99", img: "moon-lamp" },
      { name: "Scented Candle", price: "$8.50", img: "candle" },
      { name: "Smart Mug", price: "$9.50", img: "mug" },
    ],
  },
  {
    query: "kava drinks",
    src: "/img/demos/kava-drinks-panel.webp",
    count: 6,
    tiles: [
      { name: "Ginger Lime", price: "$3.99", img: "kava-ginger-lime" },
      { name: "Tropical Punch", price: "$3.99", img: "kava-tropical-punch" },
      { name: "Noble Roots", price: "$4.49", img: "kava-noble-roots" },
    ],
  },
  {
    query: "linen shirt but not white",
    src: "/img/demos/linen-shirt-panel.webp",
    count: 6,
    tiles: [
      { name: "Sage Green", price: "$34.99", img: "shirt-sage" },
      { name: "Dusty Blue", price: "$34.99", img: "shirt-blue" },
      { name: "Beige", price: "$32.99", img: "shirt-beige" },
    ],
  },
];

const QUERIES = DEMOS.map((demo) => demo.query);

/* Inline magnifying-glass glyph, matching the hand-drawn style of the other
   shared icon components (Arrow, the Growsearch CircleTick) rather than
   pulling in a new asset. */
function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-3.8-3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The Figma "search demo card": a peach results panel, a decorative-but-
 * accessible search field, a "No Dead ends" badge, a "Search → Checkout"
 * chip, and a handwritten-style annotation. Built in markup/CSS per the
 * brief rather than shipped as a single flattened image.
 */
export default function SearchDemoCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [queryIndex, setQueryIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !isVisible) return;

    const interval = window.setInterval(
      () => setQueryIndex((index) => (index + 1) % QUERIES.length),
      2800,
    );
    return () => window.clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={cardRef}
      data-visible={isVisible}
      className="relative mx-auto w-full max-w-[560px]"
    >
      <span
        className={`${styles.driftSlow} absolute -top-4 left-4 z-10 -rotate-6 rounded-full bg-[#FFD23F] px-4 py-1.5 font-poppins text-[13px] font-bold text-charcoal shadow-[0_10px_24px_-8px_rgba(23,23,23,0.35)] sm:-left-5`}
        aria-hidden
      >
        No Dead ends
      </span>

      <div className={styles.awningBox}>
        <div
          aria-hidden
          className={`${styles.awning} ${styles.scallop} h-11 rounded-t-[32px] shadow-[0_10px_20px_-16px_rgba(96,44,14,0.9)] sm:h-12`}
        />

      <div className="rounded-b-[32px] border-x border-b border-line bg-white px-5 pt-8 pb-9 shadow-glow-lg sm:px-7 sm:pt-9 sm:pb-7">
        <div className="flex items-center justify-between">
          <span className="font-poppins text-[12px] font-bold tracking-[0.22em] text-muted uppercase">
            Growsearch
          </span>
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-line" />
            <span className="size-2 rounded-full bg-line" />
            <span className="size-2 rounded-full bg-brand" />
          </div>
        </div>

        {/* Stacked and cross-faded rather than swapped, so the panel never
            blanks between queries. Decorative: the sr-only note below is the
            accessible description, and four alt texts read out at once would
            not be. */}
        {/* From sm up: the screenshot itself. */}
        <div className="relative mt-4 hidden overflow-hidden rounded-[20px] bg-peach sm:grid">
          {DEMOS.map((demo, index) => (
            <Image
              key={demo.src}
              src={demo.src}
              alt=""
              width={1386}
              height={863}
              priority={index === 0}
              sizes="560px"
              className="col-start-1 row-start-1 h-[250px] w-full object-cover object-top transition-opacity duration-500 ease-out"
              style={{ opacity: index === queryIndex ? 1 : 0 }}
            />
          ))}
        </div>

        <p className="sr-only">
          Illustration: a storefront search bar cycling through shopper
          questions such as “something warm for a rainy commute”, each shown
          with the products Growsearch returns for it.
        </p>
        <div
          aria-hidden
          className="mt-4 flex items-center gap-3 rounded-[22px] border border-line bg-white py-2 pr-2 pl-4 sm:mt-5 sm:rounded-full"
        >
          {/* On a phone the button is the magnifier, so the field does not
              carry a second one: the width goes to the question, which has to
              fit in two lines. */}
          <SearchGlyph className="hidden shrink-0 text-muted sm:block" />
          <span className="relative flex min-w-0 flex-1 items-center overflow-hidden">
            <span className="grid min-w-0 flex-1">
              {QUERIES.map((query, index) => (
                <span
                  key={query}
                  className="col-start-1 row-start-1 self-center text-[15px] leading-snug font-medium text-body-mute transition-all duration-500 ease-out sm:truncate sm:text-base"
                  style={{
                    opacity: index === queryIndex ? 1 : 0,
                    transform:
                      index === queryIndex
                        ? "translateY(0)"
                        : "translateY(9px)",
                  }}
                >
                  {query}
                </span>
              ))}
            </span>
            <span className="ml-1 h-[18px] w-[2px] shrink-0 animate-caret bg-brand" />
          </span>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-poppins text-sm font-semibold text-white sm:block sm:size-auto sm:px-5 sm:py-2.5"
          >
            <SearchGlyph className="sm:hidden" />
            <span className="max-sm:hidden">Search</span>
          </button>
        </div>

        {/* Below sm: the same answer, rebuilt for a phone. The screenshot is
            of a desktop page, and at this width it is either a thumbnail
            nobody can read or a crop that cuts its own cards in half. So the
            phone gets the three products themselves, under the question
            rather than over it, in the order a shopper meets them: ask,
            then see. */}
        <div aria-hidden className="mt-4 grid sm:hidden">
          {DEMOS.map((demo, index) => (
            <div
              key={demo.src}
              className="col-start-1 row-start-1"
              /* One set painted at a time, the incoming one fading up from
                 the card. Two sets fading through each other print one row of
                 names on top of another. */
              style={{
                opacity: index === queryIndex ? 1 : 0,
                visibility: index === queryIndex ? "visible" : "hidden",
                transition: index === queryIndex ? "opacity 300ms ease-out" : "none",
              }}
            >
              <p className="font-poppins text-[12px] font-semibold text-muted">
                <span className="text-brand">✦</span> Showing {demo.count} products
              </p>
              <ProductTiles tiles={demo.tiles} className="mt-2.5" />
            </div>
          ))}
        </div>

        <p
          id="growsearch-demo-note"
          className="mt-4 -rotate-2 text-center font-hand text-[20px] font-medium text-brand"
        >
          matched on meaning, not spelling
        </p>
      </div>
      </div>

      <span
        className={`${styles.drift} absolute right-2 -bottom-4 z-10 max-w-[calc(100%-1rem)] rounded-full bg-charcoal px-4 py-2 font-poppins text-[12px] font-semibold whitespace-nowrap text-white shadow-[0_10px_24px_-8px_rgba(23,23,23,0.5)] sm:right-3 sm:text-[13px] lg:-right-4`}
        style={{ animationDelay: "1.4s" }}
      >
        Search → Checkout
      </span>
    </div>
  );
}
