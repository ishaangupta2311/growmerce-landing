"use client";

import { useEffect, useState } from "react";

const HEADLINE_LINES = [
  { text: "Search That" },
  { text: "Understands What" },
  { text: "Shoppers Mean", accent: true },
] as const;

const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SCRAMBLE_DURATION = 1050;
const SCRAMBLE_DELAY = 120;
const TOTAL_CHARACTERS = HEADLINE_LINES.reduce(
  (total, line) => total + line.text.replaceAll(" ", "").length,
  0,
);

function scrambledLines(resolvedCharacters: number): string[] {
  let characterIndex = 0;

  return HEADLINE_LINES.map(({ text }) =>
    [...text]
      .map((character) => {
        if (character === " ") return character;

        const resolved = characterIndex < resolvedCharacters;
        characterIndex += 1;

        if (resolved) return character;

        return SCRAMBLE_CHARACTERS[
          Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length)
        ];
      })
      .join(""),
  );
}

export default function ScrambleHeadline() {
  const [displayLines, setDisplayLines] = useState<string[]>(() =>
    HEADLINE_LINES.map(({ text }) => text),
  );
  const [scrambleDone, setScrambleDone] = useState(false);

  useEffect(() => {
    let timeoutId = 0;
    let frameId = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timeoutId = window.setTimeout(() => setScrambleDone(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let startedAt = 0;
    timeoutId = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startedAt) startedAt = now;

        const progress = Math.min(
          (now - startedAt) / SCRAMBLE_DURATION,
          1,
        );
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const resolvedCharacters = Math.floor(
          easedProgress * TOTAL_CHARACTERS,
        );

        setDisplayLines(scrambledLines(resolvedCharacters));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        setDisplayLines(HEADLINE_LINES.map(({ text }) => text));
        setScrambleDone(true);
      };

      frameId = window.requestAnimationFrame(tick);
    }, SCRAMBLE_DELAY);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <h1
      aria-label="Search That Understands What Shoppers Mean"
      className="mt-4 text-[clamp(2.25rem,4.3vw,4rem)] leading-[0.99] font-extrabold tracking-[-0.035em] text-balance"
    >
      <span className="block">{displayLines[0]}</span>
      <span className="block">{displayLines[1]}</span>
      <span className="block text-brand">
        <span className={scrambleDone ? "headline-underline-active" : "headline-underline"}>
          {displayLines[2]}
          <svg
            aria-hidden="true"
            className="headline-underline-svg"
            viewBox="0 0 100 12"
            preserveAspectRatio="none"
          >
            <path
              pathLength="1"
              d="M 1 7 C 14 3.5, 25 9.5, 39 6 S 61 3.5, 73 7 S 89 9, 99 5"
            />
          </svg>
        </span>
      </span>
    </h1>
  );
}
