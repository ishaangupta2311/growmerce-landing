"use client";

import { useState } from "react";
import Reveal from "@/components/site/Reveal";
import { CAPABILITIES } from "./combines/content";
import {
  ConvergeVariant,
  PipelineVariant,
  QueryVariant,
  SonarVariant,
  WipeVariant,
} from "./combines/variants";

/**
 * "One bar instead of the whole pile" — five candidate treatments behind a
 * cycle button, so they can be compared in place rather than described.
 *
 * TEMPORARY: the switcher is a selection aid. Once one wins, keep that
 * variant, delete the rest of ./combines, and drop the cmb- keyframes from
 * globals.css — they are prefixed so they come out together.
 */

const VARIANTS = [
  { id: "wipe", name: "Wipe", note: "A divider sweeps the pile away, one bar behind it" },
  { id: "converge", name: "Converge", note: "The bolt-ons collapse into one bar" },
  { id: "pipeline", name: "Pipeline", note: "A query rides the rail through every stage" },
  { id: "sonar", name: "Sonar", note: "A sweep crosses the catalogue, matches light up" },
  { id: "query", name: "Query", note: "A sentence types itself, the stack resolves under it" },
] as const;

export default function CombinesItAll() {
  const [variant, setVariant] = useState(0);
  const active = VARIANTS[variant];

  return (
    <Reveal className="mx-auto mt-16 max-w-[1370px] px-6">
      <section
        aria-labelledby="combines-title"
        className="overflow-hidden rounded-[27px] bg-gradient-to-br from-cream via-white to-peach/40 px-7 py-12 sm:px-12 sm:py-14"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2
              id="combines-title"
              className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-charcoal"
            >
              One bar instead of the whole pile.
            </h2>
            <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-body-mute sm:text-base">
              The apps, lists and spreadsheets a store bolts on to make search
              work. Growsearch is all of them.
            </p>
          </div>

          {/* Selection aid, not final furniture. */}
          <button
            type="button"
            onClick={() => setVariant((i) => (i + 1) % VARIANTS.length)}
            className="group shrink-0 rounded-full border-2 border-brand bg-white px-5 py-2.5 text-left transition-colors duration-200 hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="block font-poppins text-[11px] font-bold tracking-[0.16em] text-brand uppercase group-hover:text-white">
              {variant + 1} / {VARIANTS.length} &middot; {active.name}
            </span>
            <span className="mt-0.5 block text-[12px] text-body-mute group-hover:text-white/85">
              {active.note} &mdash; click to cycle
            </span>
          </button>
        </div>

        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_340px] lg:gap-6">
          <div className="hidden lg:block">
            {active.id === "wipe" && <WipeVariant />}
            {active.id === "converge" && <ConvergeVariant />}
            {active.id === "pipeline" && <PipelineVariant />}
            {active.id === "sonar" && <SonarVariant />}
            {active.id === "query" && <QueryVariant />}
          </div>

          {/* The accessible form of every variant, and the legend for the
              stack. Real text, in the order a reader scans. */}
          <ul className="flex flex-col gap-1">
            {[...CAPABILITIES].reverse().map((cap) => (
              <li key={cap.id}>
                <div className="flex w-full items-start gap-3 rounded-[14px] px-3 py-2.5">
                  <span
                    aria-hidden
                    className="mt-1 size-3 shrink-0 rounded-[4px] ring-1 ring-charcoal/10"
                    style={{ background: cap.face }}
                  />
                  <span>
                    <span className="block font-poppins text-[12px] font-bold tracking-[0.14em] text-charcoal uppercase">
                      {cap.label}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-body-mute">
                      {cap.detail}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      instead of {cap.replaces.toLowerCase()}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Reveal>
  );
}
