"use client";

import { useEffect, useState } from "react";
import styles from "../nightmarket.module.css";

/* A decorative search bar, lit like a sign board on the pavement. It is a wink
   at Growsearch rather than a demo of it — nothing here is typeable, so it is
   hidden from assistive tech and described once in text. */
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
        Illustration: a lit storefront search bar cycling through shopper
        questions such as “skincare under $10”.
      </p>
      <div
        aria-hidden
        className={`${styles.tube} flex items-center gap-3 rounded-full bg-[#20140c]/92 py-3 pr-3 pl-5 backdrop-blur-[2px]`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[19px] shrink-0 drop-shadow-[0_0_6px_rgba(255,138,60,0.9)]"
          fill="none"
          aria-hidden
        >
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
            stroke="#ff8a3c"
            strokeWidth="2.4"
          />
          <path
            d="m15.5 15.5 5 5"
            stroke="#ff8a3c"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>

        <span className="relative flex min-w-0 flex-1 items-center overflow-hidden">
          <span className="grid min-w-0 flex-1">
            {QUERIES.map((q, index) => (
              <span
                key={q}
                className="col-start-1 row-start-1 truncate text-[15px] font-medium text-[#fff2e4] transition-all duration-500 ease-out sm:text-base"
                style={{
                  opacity: index === i ? 1 : 0,
                  transform: index === i ? "translateY(0)" : "translateY(9px)",
                }}
              >
                {q}
              </span>
            ))}
          </span>
          <span className="ml-1 h-[18px] w-[2px] shrink-0 animate-caret bg-[#ffc46b] shadow-[0_0_8px_rgba(255,196,107,0.9)]" />
        </span>

        <span
          className={`${styles.display} hidden shrink-0 rounded-full bg-[#ff5c1a] px-4 py-2 text-[14px] font-bold text-[#20140c] shadow-[0_0_20px_-2px_rgba(255,92,26,0.85)] sm:inline-block`}
        >
          Search
        </span>
      </div>
    </div>
  );
}
