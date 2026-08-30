"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { CAPABILITIES, SAMPLE_QUERIES } from "./content";

/* Five candidate treatments for the same section. Each fills the same box and
   tells the same story — one bar doing the work of five bolt-ons — with a
   different mechanic, so they can be compared side by side rather than
   described. */

const STAGE = "relative h-[420px] w-full";

/* ------------------------------------------------------------------- A. Wipe
   A divider sweeps across: the pile on one side, the one bar on the other. */

export function WipeVariant() {
  return (
    <div className={`${STAGE} grid place-items-center`} aria-hidden>
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[22px] border border-charcoal/10 bg-white/70 p-8">
        {/* Without: the bolt-ons, greyed and stacked up. */}
        <div className="flex flex-col gap-2">
          {CAPABILITIES.map((cap) => (
            <span
              key={cap.id}
              className="flex items-center gap-2.5 rounded-[10px] bg-charcoal/[0.04] px-3.5 py-2 text-[13px] text-muted"
            >
              <span className="size-1.5 rounded-full bg-charcoal/25" />
              {cap.replaces}
            </span>
          ))}
        </div>

        {/* With: the same box, one bar, revealed by the sweeping clip. */}
        <div className="cmb-wipe-panel absolute inset-0 grid place-items-center bg-gradient-to-br from-cream via-white to-peach/50">
          <span className="flex w-[75%] items-center gap-3 rounded-full border-2 border-brand bg-white px-5 py-3.5 shadow-[0_20px_44px_-26px_rgba(255,90,31,0.9)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-poppins text-[14px] font-bold text-charcoal">
              One search bar
            </span>
          </span>
        </div>

        <span className="cmb-wipe-edge absolute inset-y-0 w-[3px] bg-brand" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- B. Converge
   The bolt-ons fly in from the edges and collapse into one bar. */

const SCATTER = [
  { dx: "-230px", dy: "-120px" },
  { dx: "215px", dy: "-140px" },
  { dx: "-260px", dy: "70px" },
  { dx: "240px", dy: "95px" },
  { dx: "-20px", dy: "165px" },
];

export function ConvergeVariant() {
  return (
    <div className={`${STAGE} grid place-items-center overflow-hidden`} aria-hidden>
      <div className="relative">
        {CAPABILITIES.map((cap, i) => (
          <span
            key={cap.id}
            className="cmb-converge absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-charcoal/12 bg-white px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-body-mute opacity-0 shadow-[0_12px_30px_-18px_rgba(23,23,23,0.5)]"
            style={{ "--dx": SCATTER[i].dx, "--dy": SCATTER[i].dy } as CSSProperties}
          >
            {cap.replaces}
          </span>
        ))}

        <span className="cmb-bar flex w-[420px] max-w-[70vw] items-center gap-3 rounded-full border-2 border-brand bg-white px-6 py-4 opacity-0 shadow-[0_24px_50px_-26px_rgba(255,90,31,0.85)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-poppins text-[15px] font-bold text-charcoal">
            One search bar
          </span>
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- C. Pipeline
   A query rides the rail; each station lights as it is passed. */

export function PipelineVariant() {
  return (
    <div className={`${STAGE} grid place-items-center`} aria-hidden>
      <div className="w-full max-w-[620px]">
        <div className="relative h-1 rounded-full bg-charcoal/10">
          <span className="cmb-rail-fill absolute inset-0 rounded-full bg-brand/35" />
          {CAPABILITIES.map((cap, i) => (
            <span
              key={cap.id}
              className="cmb-station absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-charcoal/15 bg-white"
              style={
                {
                  left: `${(i / (CAPABILITIES.length - 1)) * 100}%`,
                  "--d": `${(i / (CAPABILITIES.length - 1)) * 6000 - 400}ms`,
                } as CSSProperties
              }
            />
          ))}
          <span className="cmb-travel absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-bold whitespace-nowrap text-white opacity-0 shadow-[0_10px_22px_-10px_rgba(255,90,31,0.9)]">
            linen shirt but not white
          </span>
        </div>

        <div className="mt-8 flex justify-between gap-2">
          {CAPABILITIES.map((cap) => (
            <span
              key={cap.id}
              className="flex-1 text-center text-[11px] leading-tight font-semibold tracking-[0.04em] text-body-mute"
            >
              {cap.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ D. Sonar
   A sweep crosses the catalogue; the matches light up behind it. */

/* Deterministic scatter — a seeded shuffle keeps the field identical between
   server and client render. */
const DOTS = Array.from({ length: 54 }, (_, i) => {
  const a = (i * 137.508 * Math.PI) / 180;
  const r = 8 + Math.sqrt(i / 54) * 40;
  return {
    x: 50 + r * Math.cos(a),
    y: 50 + r * Math.sin(a),
    hit: i % 7 === 3,
    angle: ((Math.atan2(Math.sin(a), Math.cos(a)) * 180) / Math.PI + 360) % 360,
  };
});

export function SonarVariant() {
  return (
    <div className={`${STAGE} grid place-items-center`} aria-hidden>
      <div className="relative aspect-square h-full max-h-[380px]">
        {[38, 26, 14].map((r) => (
          <span
            key={r}
            className="absolute rounded-full border border-charcoal/8"
            style={{
              inset: `${50 - r}%`,
            }}
          />
        ))}

        <span
          className="cmb-sweep absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(255,90,31,0) 0deg, rgba(255,90,31,0) 300deg, rgba(255,90,31,0.16) 352deg, rgba(255,90,31,0.42) 360deg)",
          }}
        />

        {DOTS.map((d, i) => (
          <span
            key={i}
            className={d.hit ? "cmb-hit absolute rounded-full bg-brand" : "absolute rounded-full bg-charcoal/20"}
            style={
              {
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: d.hit ? 9 : 5,
                height: d.hit ? 9 : 5,
                transform: "translate(-50%, -50%)",
                "--d": `${(d.angle / 360) * 4500}ms`,
              } as CSSProperties
            }
          />
        ))}

        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-charcoal px-4 py-2 font-poppins text-[11px] font-bold tracking-[0.16em] text-white uppercase">
          Growsearch
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ E. Query
   A sentence types itself; the capabilities resolve underneath it. */

/* Keyed by query so each sentence gets a fresh mount — that resets the typed
   text without a synchronous setState in the effect body. */
function Typewriter({ query }: { query: string }) {
  const [typed, setTyped] = useState("");
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let char = 0;
    const typing = window.setInterval(() => {
      char += 1;
      setTyped(query.slice(0, char));
      if (char >= query.length) {
        window.clearInterval(typing);
        setSettled(true);
      }
    }, 55);
    return () => window.clearInterval(typing);
  }, [query]);

  return (
    <>
      <div className="flex items-center gap-3 rounded-full border-2 border-brand bg-white px-6 py-4 shadow-[0_24px_50px_-30px_rgba(255,90,31,0.8)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-[15px] font-medium text-charcoal">
          {typed}
          <span className="animate-caret ml-0.5 inline-block h-[1.05em] w-px translate-y-[0.16em] bg-brand" />
        </span>
      </div>

      <ul className="mt-6 space-y-2">
        {CAPABILITIES.map((cap, i) => (
          <li
            key={cap.id}
            className={`flex items-center gap-3 rounded-[12px] bg-white/80 px-4 py-2.5 ${settled ? "cmb-result" : "opacity-0"}`}
            style={{ "--d": `${i * 110}ms` } as CSSProperties}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[13px] font-medium text-charcoal">{cap.label}</span>
            <span className="ml-auto text-[12px] text-muted line-through">
              {cap.replaces}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function QueryVariant() {
  const [queryIndex, setQueryIndex] = useState(0);
  const query = SAMPLE_QUERIES[queryIndex];

  useEffect(() => {
    const next = window.setTimeout(
      () => setQueryIndex((i) => (i + 1) % SAMPLE_QUERIES.length),
      query.length * 55 + 3400,
    );
    return () => window.clearTimeout(next);
  }, [query]);

  return (
    <div className={`${STAGE} grid place-items-center`} aria-hidden>
      <div className="w-full max-w-[520px]">
        <Typewriter key={queryIndex} query={query} />
      </div>
    </div>
  );
}
