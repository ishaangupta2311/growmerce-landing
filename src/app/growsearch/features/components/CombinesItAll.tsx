"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Reveal from "@/components/site/Reveal";
import { CAPABILITIES, SAMPLE_QUERIES } from "./combines/content";

/**
 * "One bar instead of the whole pile" — a sentence types itself into the bar
 * and the bolt-ons it replaces resolve underneath, struck through.
 *
 * The rows are real text, not a decorative echo of a legend: each one names a
 * capability, what it does, and the app a store would otherwise pay for.
 */

function SearchGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-brand"
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

/* Keyed by query so each sentence gets a fresh mount — that resets the typed
   text without a synchronous setState in the effect body. */
function Typewriter({
  query,
  onSettled,
}: {
  query: string;
  onSettled: () => void;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let char = 0;
    const typing = window.setInterval(() => {
      char += 1;
      setTyped(query.slice(0, char));
      if (char >= query.length) {
        window.clearInterval(typing);
        onSettled();
      }
    }, 55);
    return () => window.clearInterval(typing);
  }, [query, onSettled]);

  return (
    <>
      {typed}
      <span className="animate-caret ml-0.5 inline-block h-[1.05em] w-px translate-y-[0.16em] bg-brand" />
    </>
  );
}

export default function CombinesItAll() {
  const [queryIndex, setQueryIndex] = useState(0);
  /* Latches on the first completed sentence: the rows settle in once and then
     stay put while later queries type, rather than flashing on every cycle. */
  const [revealed, setRevealed] = useState(false);
  const query = SAMPLE_QUERIES[queryIndex];

  /* Stable, so a parent re-render does not restart the sentence. */
  const handleSettled = useCallback(() => setRevealed(true), []);

  useEffect(() => {
    const next = window.setTimeout(
      () => setQueryIndex((i) => (i + 1) % SAMPLE_QUERIES.length),
      query.length * 55 + 3400,
    );
    return () => window.clearTimeout(next);
  }, [query]);

  return (
    <Reveal className="mx-auto mt-16 max-w-[1370px] px-6">
      <section
        aria-labelledby="combines-title"
        className="overflow-hidden rounded-[27px] bg-gradient-to-br from-cream via-white to-peach/40 px-7 py-12 sm:px-12 sm:py-14"
      >
        <div className="mx-auto max-w-[620px] text-center">
          <h2
            id="combines-title"
            className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-charcoal"
          >
            One bar instead of the whole pile.
          </h2>
          <p className="mx-auto mt-2 max-w-[54ch] text-[15px] leading-relaxed text-body-mute sm:text-base">
            The apps, lists and spreadsheets a store bolts on to make search
            work. Growsearch is all of them.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[620px]">
          <p
            aria-hidden
            className="flex items-center gap-3 rounded-full border-2 border-brand bg-white px-6 py-4 text-[15px] font-medium text-charcoal shadow-[0_24px_50px_-30px_rgba(255,90,31,0.8)]"
          >
            <SearchGlyph />
            <span className="min-w-0 truncate">
              <Typewriter
                key={queryIndex}
                query={query}
                onSettled={handleSettled}
              />
            </span>
          </p>

          <ul className="mt-6 space-y-2">
            {CAPABILITIES.map((cap, i) => (
              <li
                key={cap.id}
                className={`flex items-start gap-3 rounded-[14px] bg-white/80 px-4 py-3 sm:items-center ${
                  revealed ? "cmb-result" : "opacity-0"
                }`}
                style={{ "--d": `${i * 110}ms` } as CSSProperties}
              >
                <span
                  aria-hidden
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white sm:mt-0"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m4 12.5 5.5 5.5L20 6.5"
                      stroke="currentColor"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-charcoal">
                    {cap.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-body-mute">
                    {cap.detail}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-muted line-through sm:text-[13px]">
                  {cap.replaces}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Reveal>
  );
}
