"use client";

import { useEffect, useState } from "react";

const HEADLINE_LINES = [
  "Search That",
  "Understands What",
  "Shoppers Mean",
] as const;

const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SCRAMBLE_DURATION = 1050;
const SCRAMBLE_DELAY = 120;
const TOTAL_CHARACTERS = HEADLINE_LINES.reduce(
  (total, line) => total + line.replaceAll(" ", "").length,
  0,
);

function scrambledLines(resolvedCharacters: number): string[] {
  let characterIndex = 0;

  return HEADLINE_LINES.map((line) =>
    [...line]
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
  const [displayLines, setDisplayLines] = useState<string[]>(() => [
    ...HEADLINE_LINES,
  ]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frameId = 0;
    let startedAt = 0;
    const timeoutId = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startedAt) startedAt = now;

        const progress = Math.min(
          (now - startedAt) / SCRAMBLE_DURATION,
          1,
        );
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        setDisplayLines(
          scrambledLines(Math.floor(easedProgress * TOTAL_CHARACTERS)),
        );

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        setDisplayLines([...HEADLINE_LINES]);
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
      <span className="block text-brand">{displayLines[2]}</span>
    </h1>
  );
}
