"use client";

import { useEffect, useState } from "react";
import styles from "../shopfront.module.css";

/* A decorative shop-window search bar. It is a wink at Growsearch rather than a
   demo of it — nothing here is typeable, so it is hidden from assistive tech
   and described once in text. */
const QUERIES = [
  "skincare under $10",
  "something warm for a rainy commute",
  "gift for someone who has everything",
  "kava drinks",
  "linen shirt but not white",
];

export default function HeroSearch({ className }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    const id = window.setInterval(
      () => setI((v) => (v + 1) % QUERIES.length),
      2800,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={className}>
      <p className="sr-only">
        Illustration: a storefront search bar cycling through shopper questions
        such as “skincare under $10”.
      </p>
      <div
        aria-hidden
        className="flex items-center gap-3 rounded-full border border-[#171717]/10 bg-white py-3 pr-3 pl-5 shadow-[0_18px_36px_-20px_rgba(96,44,14,0.75)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[19px] shrink-0"
          fill="none"
          aria-hidden
        >
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
            stroke="#ff5a1f"
            strokeWidth="2.4"
          />
          <path
            d="m15.5 15.5 5 5"
            stroke="#ff5a1f"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>

        <span className="relative flex min-w-0 flex-1 items-center overflow-hidden">
          <span className="grid min-w-0 flex-1">
            {QUERIES.map((q, index) => (
              <span
                key={q}
                className="col-start-1 row-start-1 truncate text-[15px] font-medium text-[#4a4a4a] transition-all duration-500 ease-out sm:text-base"
                style={{
                  opacity: index === i ? 1 : 0,
                  transform:
                    index === i ? "translateY(0)" : "translateY(9px)",
                }}
              >
                {q}
              </span>
            ))}
          </span>
          <span className="ml-1 h-[18px] w-[2px] shrink-0 animate-caret bg-[#ff5a1f]" />
        </span>

        <span
          className={`${styles.display} hidden shrink-0 rounded-full bg-[#ff5a1f] px-4 py-2 text-[14px] font-bold text-white sm:inline-block`}
        >
          Search
        </span>
      </div>
    </div>
  );
}
