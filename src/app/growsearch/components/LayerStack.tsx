"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import { GROWSEARCH_FEATURES } from "@/lib/site-urls";

/**
 * The four jobs one search bar does, drawn as an isometric stack that builds
 * bottom-up: the catalogue goes in at the base, a sale comes out at the top.
 *
 * Built in CSS 3D rather than shipped as a GIF: sharp at any size, the labels
 * stay real text, and it weighs nothing. Hovering or focusing a legend row
 * raises that layer.
 */

type Layer = {
  id: string;
  label: string;
  detail: string;
  /** Top face, and the darker extruded edge beneath it. */
  face: string;
  edge: string;
};

/* What the bar reads from. Not a job — it is what the jobs are done to. */
const BASE: Layer = {
  id: "catalogue",
  label: "Your catalogue",
  detail: "Every product, attribute and photo you already have",
  face: "#e8e8ee",
  edge: "#cfcfda",
};

/* Bottom of the stack first — the order a single query passes through. Cool at
   the base, brand orange by the time it reaches the shopper. */
const JOBS: Layer[] = [
  {
    id: "intent",
    label: "Understands intent",
    detail: "Vague, misspelled or oddly worded — it still finds the right shelf",
    face: "#f4ebe4",
    edge: "#dbcabd",
  },
  {
    id: "conversation",
    label: "Refines in conversation",
    detail: "Narrowing, switching and filtering, read out of the question",
    face: "#ffe4d6",
    edge: "#efbfa6",
  },
  {
    id: "recovery",
    label: "Never dead-ends",
    detail: "Typos fixed, close alternatives ranked in, no empty result page",
    face: "#ffb188",
    edge: "#e88a59",
  },
  {
    id: "analytics",
    label: "Proves the revenue",
    detail: "Every search, click and cart add, attributed to the product",
    face: "#ff5a1f",
    edge: "#d4400c",
  },
];

const LAYERS = [BASE, ...JOBS];

const SLAB = 300;
const GAP = 30;

/* Products still loose around the catalogue, waiting to be searched. */
const CUBES = [
  { x: -235, y: 20, s: 30, d: 0 },
  { x: -160, y: 140, s: 22, d: 700 },
  { x: -70, y: 215, s: 32, d: 1400 },
  { x: 70, y: 230, s: 24, d: 400 },
  { x: 195, y: 160, s: 28, d: 1900 },
  { x: -265, y: 165, s: 19, d: 1100 },
  { x: 25, y: 140, s: 18, d: 2400 },
  { x: 145, y: 55, s: 21, d: 1650 },
];

/** Fakes an extruded side by stacking flat shadows under the top face. */
const extrude = (edge: string, depth: number) =>
  Array.from({ length: depth }, (_, i) => `0 ${i + 1}px 0 ${edge}`).join(", ");

export default function LayerStack() {
  const [lifted, setLifted] = useState<string | null>(null);

  const legendRow = (layer: Layer, muted: boolean) => (
    <li key={layer.id}>
      <button
        type="button"
        onMouseEnter={() => setLifted(layer.id)}
        onMouseLeave={() => setLifted(null)}
        onFocus={() => setLifted(layer.id)}
        onBlur={() => setLifted(null)}
        className="flex w-full items-start gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors duration-200 hover:bg-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span
          aria-hidden
          className="mt-1 size-3 shrink-0 rounded-[4px] ring-1 ring-charcoal/10"
          style={{ background: layer.face }}
        />
        <span>
          <span
            className={`block font-poppins text-[12px] font-bold tracking-[0.14em] uppercase ${
              muted ? "text-body-mute" : "text-charcoal"
            }`}
          >
            {layer.label}
          </span>
          <span
            className={`mt-0.5 block text-[14px] leading-snug ${
              muted ? "text-muted" : "text-body-mute"
            }`}
          >
            {layer.detail}
          </span>
        </span>
      </button>
    </li>
  );

  return (
    /* Full-bleed: the gradient starts on the peach the section above ends on,
       so the two read as one surface, and lands on white for the next one. */
    <section
      aria-labelledby="layer-stack-title"
      className="bg-gradient-to-b from-peach via-cream to-white pt-16 pb-20 lg:pt-20 lg:pb-24"
    >
      <Reveal className="mx-auto max-w-[1370px] px-6">
        <h2
          id="layer-stack-title"
          className="text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold tracking-tight text-charcoal"
        >
          One search bar, doing four jobs at once
        </h2>
        <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-body-mute">
          Every Growsearch capability keeps working after the first keystroke.
          Your catalogue goes in at the bottom, and a sale comes out of the top.
        </p>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_380px] lg:gap-4">
          {/* The assembly draws 534x387 at full size, so on a phone it is
              scaled to fit rather than hidden — the isometric read is the
              whole point of it, and a flat deck of bars says nothing the
              legend does not. --stack-scale carries the factor per breakpoint
              (globals.css) because the transform below has to compose it with
              the rotation, and the height comes down to match so the section
              does not sit in a well of its own whitespace. */}
          <div
            aria-hidden
            className="relative h-[250px] w-full sm:h-[340px] lg:h-[500px]"
            style={{ perspective: "1400px" }}
          >
            <div
              className="stack-iso absolute top-1/2 left-1/2"
              style={{
                transform:
                  "translate(-50%, -50%) scale(var(--stack-scale)) translateX(var(--stack-nudge)) rotateX(56deg) rotateZ(45deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="stack-bob" style={{ transformStyle: "preserve-3d" }}>
                {CUBES.map((cube, i) => (
                  <span
                    key={i}
                    className="stack-cube absolute rounded-[4px]"
                    style={
                      {
                        width: cube.s,
                        height: cube.s,
                        left: cube.x,
                        top: cube.y,
                        background: "#f2f2f7",
                        boxShadow: extrude("#c8c8d6", Math.round(cube.s * 0.75)),
                        "--cube-dur": `${4.5 + (i % 4) * 0.9}s`,
                        "--cube-delay": `${cube.d}ms`,
                      } as CSSProperties
                    }
                  />
                ))}

                {LAYERS.map((layer, i) => (
                  <div
                    key={layer.id}
                    className="absolute"
                    style={{
                      width: SLAB,
                      height: SLAB,
                      left: -SLAB / 2,
                      top: -SLAB / 2,
                      transform: `translateZ(${
                        i * GAP + (lifted === layer.id ? 26 : 0)
                      }px)`,
                      transformStyle: "preserve-3d",
                      transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <div
                      className="stack-slab size-full rounded-[54px]"
                      style={
                        {
                          background: layer.face,
                          boxShadow: extrude(layer.edge, 9),
                          "--slab-delay": `${i * 130}ms`,
                        } as CSSProperties
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend, and the accessible form of the graphic: top layer first,
              which is the order a reader scans. The catalogue sits below the
              rule because it is what the four jobs are done to, not a fifth. */}
          <div>
            <p className="px-3 font-poppins text-[11px] font-bold tracking-[0.16em] text-brand uppercase">
              The four jobs, top down
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {[...JOBS].reverse().map((layer) => legendRow(layer, false))}
            </ul>
            <ul className="mt-3 flex flex-col gap-1 border-t border-charcoal/10 pt-3">
              {legendRow(BASE, true)}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex justify-center lg:justify-start">
          <Link href={GROWSEARCH_FEATURES} className="cta-primary">
            Explore all features
            <Arrow className="cta-arrow" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
