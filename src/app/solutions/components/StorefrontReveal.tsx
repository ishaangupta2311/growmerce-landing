"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Arrow from "@/components/site/Arrow";
import { GROWSEARCH_FEATURES } from "@/lib/site-urls";
import styles from "./StorefrontReveal.module.css";

/**
 * Unit 01 — the shutter comes up as the reader scrolls, and Growsearch is what
 * is behind it: the product presented as a boxed good, with its own facts
 * panel. The box and the facts are the /v/5 shelf, restyled to the brand.
 *
 * The section pins rather than hijacking the scroll: the page keeps moving at
 * the reader's own speed, and the shutter is simply bound to how far through
 * the runway they are. Off desktop, or under reduced motion, the shutter is
 * already up and the whole thing renders as a static storefront.
 */

/* Straight off the back of the box on /v/5 — same four facts, same wording. */
const FACTS = [
  {
    name: "Never zero results",
    dv: "100%",
    body: "“0 results for kava drinks” becomes “we don’t have kava drinks — but you might like these Kratom Seltzers”. Typos fixed, intent understood, a real shelf offered instead of an apology.",
  },
  {
    name: "Plain-language queries",
    dv: "100%",
    body: "“skincare under $10”, “warm but not bulky”, “gift, arrives friday”. Price, attribute and intent are read straight out of the sentence — no filter archaeology.",
  },
  {
    name: "Add to cart from results",
    dv: "100%",
    body: "Shoppers buy without leaving the results, and the cart count updates where they already are.",
  },
  {
    name: "Search-attributed revenue",
    dv: "100%",
    body: "Searches tied to checkouts, zero-result terms surfaced as a buying list, revenue attributed to the search box.",
  },
];

/* Twelve scallops, alternating brand and cream. */
const SCALLOPS = Array.from({ length: 12 }, (_, i) => i);

/* Deterministic bar widths — a real barcode's rhythm without an asset. */
const BARS = Array.from({ length: 32 }, (_, i) => ((i * 7919) % 5) + 1);

function Barcode() {
  return (
    <span aria-hidden className="flex h-9 w-[128px] items-end gap-[2px]">
      {BARS.map((w, i) => (
        <span
          key={i}
          className="h-full bg-charcoal"
          style={{ width: w, opacity: w > 3 ? 1 : 0.75 }}
        />
      ))}
    </span>
  );
}

export default function StorefrontReveal() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(false);
  const [isPinned, setIsPinned] = useState(false);
  /* 0 = shutter down, 1 = fully open and settled. */
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!isPinnedRef.current) return;
      const runway = runwayRef.current;
      const stage = stageRef.current;
      if (!runway || !stage) return;

      const rect = runway.getBoundingClientRect();
      const stickyTop = 80;
      const travel = Math.max(rect.height - stage.offsetHeight, 1);
      const travelled = Math.min(Math.max(stickyTop - rect.top, 0), travel);
      setProgress(travelled / travel);
    };

    const requestUpdate = () => {
      if (!isPinnedRef.current) return;
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    const syncMode = () => {
      const shouldPin =
        desktopQuery.matches &&
        !reducedMotionQuery.matches &&
        window.innerHeight >= 780;

      isPinnedRef.current = shouldPin;
      setIsPinned(shouldPin);
      /* Unpinned means no scroll to read progress from, so show it open. */
      if (shouldPin) requestUpdate();
      else setProgress(1);
    };

    syncMode();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", syncMode);
    desktopQuery.addEventListener("change", syncMode);
    reducedMotionQuery.addEventListener("change", syncMode);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", syncMode);
      desktopQuery.removeEventListener("change", syncMode);
      reducedMotionQuery.removeEventListener("change", syncMode);
    };
  }, []);

  const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
  /* The interior is already settling in behind the shutter as it rises —
     otherwise the lift uncovers an empty room. Both finish well before the
     runway ends, so the unit gets a beat of stillness on the way past. */
  const open = clamp01((progress - 0.04) / 0.56);
  const inside = clamp01((progress - 0.16) / 0.3);

  return (
    <section
      aria-labelledby="unit-01-title"
      className="mx-auto max-w-[1370px] px-6 pb-8"
    >
      <div ref={runwayRef} data-pinned={isPinned} className={styles.runway}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={{ "--open": open } as CSSProperties}
        >
          <div className="flex flex-col rounded-[26px] bg-[#f9f2ec] px-5 py-5 sm:px-8">
            <div className="text-center">
              <h2
                id="unit-01-title"
                className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight text-charcoal"
              >
                Unit 01 is open.
              </h2>
              <p className="mt-1 text-[15px] text-body-mute">
                Growsearch &mdash; live now on Shopify.
              </p>
            </div>

            {/* Shopfront */}
            <div className="relative mx-auto mt-5 flex w-full max-w-[1120px] flex-col">
              {/* Awning: a header rail and twelve scallops hanging off it. */}
              <div aria-hidden className={`${styles.valance} shrink-0`}>
                <div className="h-3.5 rounded-t-[10px] bg-[#d4400c]" />
                {/* Each stripe runs the full drop and rounds off at the foot,
                    so the canopy and its scalloped fringe are one piece. */}
                <div className="flex h-[58px] gap-[1px] px-[3px]">
                  {SCALLOPS.map((i) => (
                    <span
                      key={i}
                      className="h-full flex-1 rounded-b-[999px]"
                      style={{
                        background: i % 2 === 0 ? "#ff5a1f" : "#fffaf6",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Window: the shutter slides up out of it. */}
              <div className="relative -mt-5 overflow-hidden rounded-b-[22px] border-x-[6px] border-b-[6px] border-[#f0d3c1] bg-[#fffaf6]">
                <div className="px-5 pt-10 pb-6 sm:px-8 sm:pt-11 sm:pb-7">
                  <div
                    className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8"
                    style={{
                      opacity: inside,
                      transform: `translateY(${(1 - inside) * 24}px)`,
                    }}
                  >
                    {/* The product, boxed. */}
                    <div className={`${styles.boxScene} flex flex-col`}>
                      <div
                        className={`${styles.box3d} relative mx-auto w-full max-w-[360px]`}
                      >
                        <div
                          aria-hidden
                          className={`${styles.boxTop} rounded-t-[6px] bg-[#ffcdb5]`}
                        />
                        <div
                          aria-hidden
                          className={`${styles.boxSide} flex items-center justify-center bg-[#d4400c]`}
                        >
                          <span
                            className="font-poppins text-[12px] font-bold tracking-[0.2em] text-white/90 uppercase"
                            style={{ writingMode: "vertical-rl" }}
                          >
                            Growsearch
                          </span>
                        </div>

                        <div className="relative rounded-[6px] bg-white shadow-[0_30px_60px_-34px_rgba(96,44,14,0.85)] ring-1 ring-brand/15">
                          <div className="flex items-center justify-between rounded-t-[6px] bg-brand px-4 py-2 font-poppins text-[10px] font-bold tracking-[0.22em] text-white uppercase">
                            <span>Growmerce</span>
                            <span>Aisle 01</span>
                          </div>

                          <div className="px-5 pt-4 pb-4">
                            <h3 className="text-[clamp(1.5rem,2.6vw,2rem)] leading-none font-extrabold tracking-tight text-charcoal">
                              Growsearch
                            </h3>
                            <p className="mt-2 text-[13px] leading-snug font-semibold text-body-mute">
                              Storefront search that never dead-ends &mdash; and
                              analytics that prove what search sells.
                            </p>

                            <div className="mt-3 overflow-hidden rounded-[10px] bg-cream p-1.5 ring-1 ring-brand/12">
                              <Image
                                src="/img/demos/linen-shirt-panel.webp"
                                alt=""
                                width={900}
                                height={520}
                                sizes="360px"
                                className="h-[96px] w-full rounded-[7px] object-cover object-top"
                              />
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-4">
                              <div>
                                <p className="font-poppins text-[9px] font-bold tracking-[0.18em] text-muted uppercase">
                                  Net contents
                                </p>
                                <p className="text-[13px] font-extrabold text-charcoal">
                                  1 Shopify storefront
                                </p>
                              </div>
                              <div className="text-right">
                                <Barcode />
                                <p className="mt-1 font-poppins text-[8.5px] font-bold tracking-[0.26em] text-muted">
                                  GRW&middot;05&middot;0001
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shelf flash. */}
                        <span
                          aria-hidden
                          className={`${styles.starburst} absolute -top-9 -right-11 z-[4] grid size-[78px] place-items-center bg-brand text-center`}
                        >
                          <span className="font-poppins text-[15px] leading-none font-extrabold text-white">
                            New!
                            <span className="mt-0.5 block text-[7px] tracking-[0.14em]">
                              On shelves
                            </span>
                          </span>
                        </span>
                      </div>

                      {/* Shelf lip, and the tag clipped to it. */}
                      <div className="mx-auto mt-5 w-full max-w-[420px]">
                        <div
                          aria-hidden
                          className="h-2.5 rounded-[3px] bg-[#f0d3c1] shadow-[0_10px_18px_-14px_rgba(96,44,14,0.9)]"
                        />
                        <div className="mt-4 flex justify-center">
                          <Link href={GROWSEARCH_FEATURES} className="cta-primary">
                            Explore Growsearch
                            <Arrow className="cta-arrow" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* The back of the box. */}
                    <div className="rounded-[18px] bg-white px-5 py-4 shadow-[0_24px_60px_-44px_rgba(23,23,23,0.7)] ring-1 ring-brand/12 sm:px-6">
                      <p className="border-b-4 border-charcoal pb-1 text-[clamp(1.35rem,2.4vw,1.75rem)] font-extrabold tracking-tight text-charcoal">
                        Search facts
                      </p>
                      <p className="border-b border-charcoal/70 py-1 font-poppins text-[10px] font-bold tracking-[0.08em] text-body-mute uppercase">
                        Serving size: 1 storefront &middot; Servings per store:
                        unlimited
                      </p>
                      <div className="flex items-end justify-between border-b-[3px] border-charcoal pt-1 pb-1 font-poppins text-[9.5px] font-bold tracking-[0.12em] text-charcoal uppercase">
                        <span>Amount per storefront</span>
                        <span>% Daily value*</span>
                      </div>

                      <ul>
                        {FACTS.map((f) => (
                          <li
                            key={f.name}
                            className="border-b border-charcoal/12 py-2 last:border-b-0"
                          >
                            <div className="flex items-baseline justify-between gap-4">
                              <h4 className="text-[14px] leading-tight font-bold text-charcoal">
                                {f.name}
                              </h4>
                              <span className="shrink-0 font-poppins text-[11px] font-bold text-brand">
                                {f.dv}
                              </span>
                            </div>
                            <p className="mt-1 text-[12.5px] leading-snug text-body-mute">
                              {f.body}
                            </p>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-1 border-t-[3px] border-charcoal pt-2">
                        <p className="text-[11px] leading-snug text-muted">
                          * Percent daily value based on one storefront.
                          Contains no replatforming, no six-week onboarding and
                          no AI team. Fits the store you already run.
                        </p>
                        <p className="mt-1.5 font-poppins text-[11px] leading-snug font-bold text-charcoal">
                          Launching now on the Shopify App Store &middot;
                          WooCommerce next.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* The shutter itself, riding up over everything above. */}
                <div
                  aria-hidden
                  className={`${styles.shutter} absolute inset-0 z-[5] flex items-end justify-center pb-10 will-change-transform`}
                >
                  <span
                    className="font-poppins text-[11px] font-bold tracking-[0.28em] text-[#a8836c] uppercase"
                    style={{ opacity: Math.max(0, 1 - open * 2.4) }}
                  >
                    Keep scrolling to raise the shutter
                  </span>
                  <span
                    className={`${styles.rail} absolute inset-x-0 bottom-0 h-[14px]`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
