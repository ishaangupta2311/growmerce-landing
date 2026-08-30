"use client";

import { useState, type CSSProperties } from "react";
import Reveal from "@/components/site/Reveal";

/**
 * The five layers between a supplier's raw files and what a shopper sees,
 * drawn as an isometric stack that builds bottom-up.
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

/* Bottom of the stack first — the order things arrive in. Cool and unsorted at
   the base, brand orange by the time it reaches the shopper. */
const LAYERS: Layer[] = [
  {
    id: "raw",
    label: "Raw data",
    detail: "Spreadsheets, PDFs, supplier photos",
    face: "#e8e8ee",
    edge: "#cfcfda",
  },
  {
    id: "ingestion",
    label: "Ingestion",
    detail: "Supplier feeds, any format",
    face: "#f4ebe4",
    edge: "#dbcabd",
  },
  {
    id: "structure",
    label: "Structure",
    detail: "Attributes and taxonomy, normalised",
    face: "#ffe4d6",
    edge: "#efbfa6",
  },
  {
    id: "workflows",
    label: "Workflows",
    detail: "Descriptions, QA, triage, reporting",
    face: "#ffb188",
    edge: "#e88a59",
  },
  {
    id: "storefront",
    label: "Storefront",
    detail: "Search, PDPs, what shoppers actually see",
    face: "#ff5a1f",
    edge: "#d4400c",
  },
];

const SLAB = 300;
const GAP = 30;

/* The loose files that have not been through the stack yet. */
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

  return (
    <Reveal className="mx-auto mt-4 max-w-[1370px] px-6">
      <section
        aria-labelledby="layer-stack-title"
        className="overflow-hidden rounded-[27px] bg-gradient-to-br from-cream via-white to-peach/40 px-7 py-12 sm:px-12 sm:py-14"
      >
        <h2
          id="layer-stack-title"
          className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-charcoal"
        >
          Growmerce combines it all.
        </h2>
        <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-body-mute sm:text-base">
          Every job your team does by hand between the supplier and the
          storefront &mdash; one layer at a time. Growsearch is the top of it.
        </p>

        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_340px] lg:gap-4">
          {/* Hidden under lg: the isometric footprint needs width it does not
              have there, and the legend already says everything. */}
          <div
            aria-hidden
            className="relative hidden h-[500px] w-full lg:block"
            style={{ perspective: "1400px" }}
          >
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                transform: "translate(-50%, -50%) rotateX(56deg) rotateZ(45deg)",
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
              which is the order a reader scans. */}
          <ul className="flex flex-col gap-1">
            {[...LAYERS].reverse().map((layer) => (
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
                    <span className="block font-poppins text-[12px] font-bold tracking-[0.14em] text-charcoal uppercase">
                      {layer.label}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-body-mute">
                      {layer.detail}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Reveal>
  );
}
