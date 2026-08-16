"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Reveal from "@/components/site/Reveal";
import styles from "../shopfront.module.css";
import ProductCarton from "./ProductCarton";
import {
  AwningBand,
  ChunkyArrow,
  focusRing,
  SectionHeading,
  Sparkle,
} from "./bits";

/* Runs before the first paint in the browser, and is simply skipped during
   SSR — the server markup is the fully-open, nothing-hidden state. */
const useBeforePaint =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/* --------------------------------------------------------------------------
   Window display: the four things Growsearch does, as sticker cards.
-------------------------------------------------------------------------- */

function WindowCard({
  label,
  title,
  children,
  className,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${styles.sticker} flex h-full flex-col rounded-[20px] bg-white p-4 shadow-[0_16px_34px_-26px_rgba(96,44,14,0.9)] ring-1 ring-[#171717]/8 ${className ?? ""}`}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ffe4d6] px-2.5 py-[3px] text-[10.5px] font-extrabold tracking-[0.1em] text-[#ff5a1f] uppercase">
        {label}
      </span>
      <h4
        className={`${styles.display} mt-2 text-[16px] leading-[1.25] font-bold text-balance`}
      >
        {title}
      </h4>
      <div className="mt-2 text-[13px] leading-[1.45] text-[#4a4a4a]">
        {children}
      </div>
    </div>
  );
}

function CartGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 3h2.2l2.1 10.4a1.6 1.6 0 0 0 1.6 1.3h7.8a1.6 1.6 0 0 0 1.6-1.2l1.5-6.1H6" />
      <circle cx="9.5" cy="19.4" r="1.5" />
      <circle cx="16.8" cy="19.4" r="1.5" />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   The open shop
-------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   The running order of the pinned scene, in units of --p (0→1 across the
   pinned travel). Nothing moves before HOLD_END: the visitor arrives at a
   shop that is shut, and gets a beat to notice that.

     0.00 → 0.12   hold      shutter down, shop closed
     0.12 → 0.44   act 1     shutter rolls up (a third of the travel), the
                             carton is uncovered and settles
     0.50 → 0.86   acts 2–5  the four window cards, one at a time
     0.88 → 1.00   act 6     the door: CTA row, then a beat to read it
-------------------------------------------------------------------------- */
const SCENE = {
  holdEnd: 0.12,
  shutterSpan: 0.32,
  cards: [0.5, 0.6, 0.7, 0.8] as const,
  door: 0.88,
} as const;

/* Pinned travel, in viewport heights, and the gaps the pin needs to breathe.
   The gaps are measured from under the page's sticky header, not from the top
   of the viewport — the shopfront has to be genuinely visible, not merely
   on-screen behind the nav. */
const TRAVEL_VH = 3.2;
const PIN_GAP_TOP = 16;
const PIN_GAP_BOTTOM = 24;
const PIN_MAX_GAP_TOP = 72;

/** Height of the page's own sticky/fixed header, whatever it happens to be. */
function headerHeight() {
  const header = document.querySelector("header");
  if (!header) return 0;
  const pos = getComputedStyle(header).position;
  if (pos !== "sticky" && pos !== "fixed") return 0;
  return header.offsetHeight;
}

/* Pinned: gated by --p on the scene timeline (see .stageItem in the CSS).
   Otherwise: falls back to an ordinary staggered scroll reveal. */
function Stage({
  t,
  delay,
  ramp = 0.075,
  className,
  children,
}: {
  t: number;
  delay: number;
  ramp?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className={className ?? "h-full"} delay={delay}>
      <div
        className={`${styles.stageItem} ${className ?? "h-full"}`}
        style={{ "--t": t, "--ramp": ramp } as CSSProperties}
      >
        {children}
      </div>
    </Reveal>
  );
}

function GrowsearchShop() {
  const [cart, setCart] = useState(0);

  return (
    <article
      className={`${styles.shopOpen} relative`}
      aria-labelledby="shop-growsearch"
    >
      {/* Hanging signboard over the pavement. */}
      <div className="pointer-events-none absolute -top-1 left-6 z-40 sm:left-10">
        <div className={`${styles.signHang} ${styles.signBoard} relative`}>
          <div className="mx-auto flex w-[132px] justify-between px-3">
            <span className={`${styles.strap} h-5 w-[3px] rounded-full`} />
            <span className={`${styles.strap} h-5 w-[3px] rounded-full`} />
          </div>
          <div className="rounded-[14px] border-2 border-[#171717] bg-[#ffffff] px-4 py-1.5 shadow-[0_10px_18px_-14px_rgba(96,44,14,0.9)]">
            <span className={styles.signStack}>
              <span
                className={`${styles.display} ${styles.openSign} ${styles.signFace} block text-center text-[15px] font-extrabold tracking-[0.16em] text-[#ff5a1f] uppercase`}
              >
                Open
              </span>
              <span
                aria-hidden
                className={`${styles.display} ${styles.signFace} ${styles.faceClosed} block text-center text-[15px] font-extrabold tracking-[0.16em] uppercase`}
              >
                Closed
              </span>
            </span>
          </div>
        </div>
      </div>

      <div
        className={`${styles.shopLight} ${styles.awningBox} relative overflow-hidden rounded-[34px] bg-[#ffffff] shadow-[0_30px_60px_-40px_rgba(96,44,14,0.8)] ring-1 ring-[#171717]/10`}
      >
        {/* Warm light spilling from inside on hover. */}
        <div
          aria-hidden
          className={`${styles.shopGlow} pointer-events-none absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(60%_70%_at_50%_100%,rgba(255,167,74,0.42),transparent_70%)]`}
        />

        {/* The awning is square-cornered by design; the card's own
            overflow-hidden trims it back to the 34px silhouette. It sits above
            the shutter (which is z-30) because the canopy hangs outside the
            shop and the shutter rolls down behind it. */}
        <div className="relative z-40">
          <AwningBand className="h-11 sm:h-12 lg:h-11" />
        </div>

        {/* The roll shutter: rides on --open, clipped to the interior so it
            disappears behind the awning as it rises. The clip box carries the
            card's own bottom radius so the slats and the bottom bar finish on
            the rounded silhouette instead of squaring off the corners. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-11 bottom-0 z-30 overflow-hidden rounded-b-[33px] sm:top-12"
        >
          <div className={`${styles.shutter} ${styles.rollShutter} absolute inset-0`}>
            <div className="absolute inset-x-0 bottom-0 h-4 bg-[#c9a68d] shadow-[0_3px_8px_rgba(96,44,14,0.4)]" />
            <div className="absolute bottom-1 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#171717]/25" />
          </div>
        </div>

        <div
          className={`${styles.shopContents} relative px-5 pt-11 pb-6 sm:px-7 lg:px-8 lg:pt-8 lg:pb-6`}
        >
          <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
            <div className="min-w-0">
              <h3
                id="shop-growsearch"
                className={`${styles.display} text-[clamp(1.7rem,2.8vw,2.15rem)] leading-none font-extrabold`}
              >
                Growsearch
              </h3>
              <p className="mt-2 max-w-[58ch] text-[14px] leading-[1.45] text-[#4a4a4a]">
                Storefront search that never dead-ends — and analytics that
                prove what search sells. For Shopify stores with catalogues
                worth browsing.
              </p>
            </div>

            {/* Shop counter cart — the badge pops when a window card is used. */}
            <div className="relative shrink-0">
              <div
                className={`${cart > 0 ? styles.cartNudge : ""} flex size-[46px] items-center justify-center rounded-full border-2 border-[#171717] bg-white text-[#171717]`}
                key={`cart-${cart}`}
              >
                <CartGlyph className="size-[22px]" />
              </div>
              {cart > 0 ? (
                <span
                  key={cart}
                  aria-hidden
                  className={`${styles.badgePop} ${styles.display} absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-[#ff5a1f] text-[12px] font-extrabold text-white shadow-[0_6px_12px_-6px_rgba(255,90,31,1)]`}
                >
                  {cart}
                </span>
              ) : null}
              <span aria-live="polite" className="sr-only">
                {cart === 0
                  ? "Demo cart is empty"
                  : `Demo cart: ${cart} item${cart === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>

          {/* The shop floor. The carton is what the shutter uncovers (act 1);
              the four cards then arrive one at a time on the right; the door
              sits under the carton, so the window display never leaves a
              column of dead space beneath it. DOM order stays
              carton → window → door, which is also the reading order. */}
          <div className="mt-4 grid items-start gap-x-7 gap-y-2.5 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)]">
            <div className={`${styles.cartonReveal} lg:col-start-1 lg:row-start-1`}>
              <ProductCarton />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <Stage t={SCENE.cards[0]} delay={0}>
            <WindowCard
              label="Never zero results"
              title="Nothing in stock? Offer the next best thing."
            >
              <p className="text-[12px] font-semibold text-[#8a6b58] line-through">
                0 results for “kava drinks”
              </p>
              <p className="mt-1.5 rounded-[14px] bg-[#ffe4d6] px-3 py-2 text-[12.5px] leading-snug font-medium text-[#171717]">
                “We don&rsquo;t have kava drinks — but you might like these
                Kratom Seltzers ✨”
              </p>
              <p className="mt-1.5">
                Typos fixed, intent understood, a real shelf offered instead of
                an apology.
              </p>
            </WindowCard>
            </Stage>

            <Stage t={SCENE.cards[1]} delay={110}>
            <WindowCard
              label="Plain language"
              title="Shoppers ask the way they talk."
            >
              <div className="flex flex-wrap gap-1.5">
                {[
                  "skincare under $10",
                  "warm but not bulky",
                  "gift, arrives friday",
                ].map((q) => (
                  <span
                    key={q}
                    className="rounded-full bg-[#fff4ee] px-2.5 py-1 text-[12px] font-medium text-[#4a4a4a] ring-1 ring-[#171717]/8"
                  >
                    {q}
                  </span>
                ))}
              </div>
              <p className="mt-2">
                Price, attribute and intent are read out of the sentence — no
                filter archaeology required.
              </p>
            </WindowCard>
            </Stage>

            <Stage t={SCENE.cards[2]} delay={220}>
            <WindowCard
              label="Buy from search"
              title="Add to cart without leaving the results."
            >
              <div className="flex items-center gap-2.5 rounded-[14px] bg-[#fff4ee] p-2 ring-1 ring-[#171717]/8">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#ffd6c2] text-[#ff5a1f]"
                >
                  <Sparkle className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-[#171717]">
                    Kratom Seltzer · Yuzu
                  </span>
                  <span className="block text-[11.5px] text-[#8a8a8a]">
                    $9.00 · in stock
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCart((c) => Math.min(c + 1, 9))}
                  className={`${styles.springy} ${styles.display} ${focusRing} shrink-0 rounded-full bg-[#171717] px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#ff5a1f]`}
                >
                  Add
                </button>
              </div>
              <p className="mt-2">
                Try it — the counter above is the shopper&rsquo;s cart, updating
                where they already are.
              </p>
            </WindowCard>
            </Stage>

            <Stage t={SCENE.cards[3]} delay={330}>
            <WindowCard
              label="Search analytics"
              title="See what search actually sells."
            >
              <div className="flex items-end gap-1.5" aria-hidden>
                {[38, 52, 44, 68, 60, 84, 76].map((h, i) => (
                  <span
                    key={i}
                    className="w-full rounded-t-[4px] bg-[#ff5a1f]"
                    style={{ height: `${h * 0.5}px`, opacity: 0.35 + i * 0.09 }}
                  />
                ))}
              </div>
              <p className="mt-2">
                Searches tied to checkouts, zero-result terms surfaced as a
                buying list, revenue attributed to the search box.
              </p>
            </WindowCard>
            </Stage>
            </div>

            {/* The shop door — last act of the scene. */}
            <Stage
              t={SCENE.door}
              delay={440}
              ramp={0.06}
              className="lg:col-start-1 lg:row-start-2 lg:self-end"
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 lg:flex-col lg:items-start lg:gap-y-2">
                <Link
                  href="#"
                  className={`${styles.springy} ${styles.display} ${focusRing} group inline-flex items-center gap-2.5 rounded-full bg-[#ff5a1f] px-6 py-3 text-[16px] font-bold text-white shadow-[0_14px_28px_-14px_rgba(255,90,31,0.95)] hover:bg-[#e04a10]`}
                >
                  Explore Growsearch
                  <ChunkyArrow className="size-[18px] transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </Link>

                <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#171717]/25 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8a8a8a]">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-[#ffcf6b] ring-4 ring-[#ffcf6b]/25"
                  />
                  Its own website is opening soon
                </span>

                <p className="text-[12.5px] leading-snug font-semibold text-[#8a8a8a]">
                  Launching now on the Shopify App Store · WooCommerce next.
                </p>
              </div>
            </Stage>
          </div>
        </div>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------------------
   The shops still boarded up
-------------------------------------------------------------------------- */

function ShutteredShop({
  unit,
  note,
  className,
}: {
  unit: string;
  note: string;
  className?: string;
}) {
  return (
    <article
      className={`${styles.shopShut} group relative ${className ?? ""}`}
      aria-label={`Unit ${unit} — opening soon`}
    >
      <div
        className={`${styles.awningBox} relative overflow-hidden rounded-[30px] bg-[#f7e6db] shadow-[0_22px_46px_-34px_rgba(96,44,14,0.85)] ring-1 ring-[#171717]/10`}
      >
        <AwningBand deep className="h-9 opacity-80 saturate-[0.45]" />

        <div className="relative px-4 pt-12 pb-5 sm:px-5">
          <p
            className={`${styles.display} text-[15px] font-extrabold tracking-[0.16em] text-[#8a6b58] uppercase`}
          >
            Unit {unit}
          </p>

          {/* The shutter itself lifts a little when you come close. */}
          <div className="relative mt-3 h-[168px] overflow-hidden rounded-[18px] ring-1 ring-[#171717]/10 sm:h-[196px]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(255,167,74,0.55),rgba(255,232,223,0.2)_70%)]"
            />
            <div
              aria-hidden
              className={`${styles.shutter} ${styles.shutterLift} absolute inset-0`}
            />
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <span
                className={`${styles.hand} rounded-full bg-[#171717] px-3 py-1 text-[16px] leading-tight text-[#ffe4d6] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100`}
              >
                psst — soon
              </span>
            </div>
          </div>

          {/* Hanging "opening soon" plate. */}
          <div className="mt-4 flex justify-center">
            <div className={`${styles.signHang} text-center`}>
              <div className="mx-auto flex w-16 justify-between px-1">
                <span className={`${styles.strap} h-3.5 w-[2px] rounded-full`} />
                <span className={`${styles.strap} h-3.5 w-[2px] rounded-full`} />
              </div>
              <span
                className={`${styles.display} block rounded-[10px] border-2 border-[#171717]/70 bg-[#ffffff] px-3 py-1 text-[12.5px] font-extrabold tracking-[0.1em] text-[#171717]/75 uppercase`}
              >
                Opening soon
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[13px] leading-snug text-[#8a8a8a]">
            {note}
          </p>
        </div>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------------------
   Section
-------------------------------------------------------------------------- */

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export default function HighStreet() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useBeforePaint(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;

    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqStill = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* --- Layout facts, re-measured only when something can have changed ---
       jack     is the pin worth doing at this size?
       pinTop   where the card rests while pinned (px from the viewport top)
       travel   how much scroll the scene gets while pinned (px)          */
    let jack = false;
    let pinTop = PIN_GAP_TOP;
    let travel = 0;

    const measure = () => {
      const vh = window.innerHeight;
      // The card's own height, unaffected by the scene (the acts only move
      // opacity and transform, so this stays put once fonts have loaded).
      const cardH = stage.offsetHeight;
      const headH = headerHeight();
      // Everything the card is not using, under the header.
      const free = vh - headH - cardH;

      jack =
        mqLg.matches &&
        !mqStill.matches &&
        free >= PIN_GAP_TOP + PIN_GAP_BOTTOM;
      pinTop =
        headH +
        Math.round(
          Math.min(PIN_MAX_GAP_TOP, Math.max(PIN_GAP_TOP, free / 2)),
        );
      travel = Math.round(TRAVEL_VH * vh);

      // The runway is exactly the card plus the pinned travel, so the scene
      // starts the instant the card lands on its mark and ends the instant it
      // is released — no scroll is spent on a half-visible shopfront.
      const height = jack ? `${cardH + travel}px` : "";
      if (runway.style.height !== height) runway.style.height = height;
      runway.style.setProperty("--pin-top", `${pinTop}px`);
      runway.dataset.jacked = String(jack);
    };

    const frame = () => {
      raf = 0;
      let p: number;
      let open: number;

      if (jack) {
        // p is 0 the moment the runway's top reaches the pin line — which is
        // also the moment the card is fully settled and fully in view.
        p = clamp01((pinTop - runway.getBoundingClientRect().top) / travel);
        open = clamp01((p - SCENE.holdEnd) / SCENE.shutterSpan);
      } else {
        // No pin: the acts are all "already played" and the shutter scrubs
        // over a long stretch of the page's own scroll.
        p = 1;
        const top = stage.getBoundingClientRect().top;
        open = clamp01((window.innerHeight * 0.88 - top) / (window.innerHeight * 0.55));
      }

      runway.style.setProperty("--p", p.toFixed(4));
      stage.style.setProperty("--open", open.toFixed(4));
      // Written straight to the DOM rather than through React state, so the
      // very first layout pass already matches the scroll position and the
      // sign can never be caught showing both faces.
      stage.dataset.open = open > 0.55 ? "true" : "false";
    };

    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    frame();
    // Arm the sign's flip transition only after the corrected first paint.
    const armed = requestAnimationFrame(() => {
      stage.dataset.armed = "true";
    });

    const ro = new ResizeObserver(onResize);
    ro.observe(stage);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    mqLg.addEventListener("change", onResize);
    mqStill.addEventListener("change", onResize);
    // Web fonts land after hydration and change the card's height.
    void document.fonts?.ready.then(onResize);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(armed);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mqLg.removeEventListener("change", onResize);
      mqStill.removeEventListener("change", onResize);
      runway.style.height = "";
      runway.removeAttribute("data-jacked");
    };
  }, []);

  return (
    <section
      id="high-street"
      aria-labelledby="high-street-title"
      className="relative px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow="the high street"
              title={<span id="high-street-title">One shop open. More being built.</span>}
              lead="Every Growmerce tool gets its own shopfront — its own product, its own price, its own proof. We only put up a sign once the thing behind it works."
            />
            <p
              className={`${styles.hand} max-w-[15rem] text-[21px] leading-tight text-[#8a8a8a]`}
            >
              have a look in the window &mdash; the cart is real
            </p>
          </div>
        </Reveal>

        {/* The visit to the Growsearch shop. The runway's extra height — set
            from JS once the card has been measured — is the scroll the visitor
            spends inside the scene. Without JS it is just a section. */}
        <div ref={runwayRef} className={`${styles.runway} mt-14 lg:mt-16`}>
          <div
            ref={stageRef}
            data-open="true"
            className={`${styles.stagePin} ${styles.shopStage}`}
          >
            <GrowsearchShop />
          </div>
        </div>

        {/* Then on down the street — each unit is its own stop. */}
        <div className="mt-20 lg:mt-28 lg:pr-[22%]">
          <Reveal>
            <ShutteredShop
              unit="02"
              note="Next on the street. It gets a name when it has customers."
              className="mx-auto max-w-[460px]"
            />
          </Reveal>
        </div>

        <div className="mt-16 lg:mt-24 lg:pl-[22%]">
          <Reveal>
            <ShutteredShop
              unit="03"
              note="On the drawing board. Validated before it is announced."
              className="mx-auto max-w-[460px]"
            />
          </Reveal>
        </div>

        {/* Pavement. */}
        <div aria-hidden className="mt-10">
          <div className={`${styles.shelf} h-3 rounded-full`} />
          <div className="mt-1.5 h-px w-full bg-[#171717]/8" />
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-center text-[15px] leading-relaxed text-[#8a8a8a]">
          New shops go up the same way this one did: build fast, sell it to real
          store owners, keep it only if they keep paying.
        </p>
      </div>
    </section>
  );
}
