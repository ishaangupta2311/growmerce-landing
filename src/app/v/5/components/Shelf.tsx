"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import Reveal from "@/components/site/Reveal";
import styles from "../bazaar.module.css";
import {
  Barcode,
  ChunkyArrow,
  focusRing,
  GunTag,
  SectionHeading,
  Sparkle,
  Stamp,
  Starburst,
  Sticker,
  Tape,
} from "./bits";

/* --------------------------------------------------------------------------
   Confetti — twelve printed rectangles, fixed vectors so the server and the
   browser render the same markup. One shot per click.
-------------------------------------------------------------------------- */

const CONFETTI = [
  { dx: -72, dy: -30, spin: -200, d: 0, c: "#ff5c1a" },
  { dx: -56, dy: -58, spin: 160, d: 15, c: "#ffd66e" },
  { dx: -34, dy: -76, spin: -140, d: 30, c: "#8ed4e6" },
  { dx: -12, dy: -82, spin: 220, d: 10, c: "#2b1c14" },
  { dx: 10, dy: -78, spin: -190, d: 40, c: "#d1400a" },
  { dx: 32, dy: -70, spin: 150, d: 25, c: "#ffd66e" },
  { dx: 54, dy: -52, spin: -230, d: 5, c: "#ff5c1a" },
  { dx: 70, dy: -26, spin: 180, d: 45, c: "#8ed4e6" },
  { dx: -46, dy: -12, spin: -120, d: 55, c: "#ffd66e" },
  { dx: 46, dy: -8, spin: 130, d: 35, c: "#2b1c14" },
  { dx: -20, dy: -46, spin: 240, d: 20, c: "#d1400a" },
  { dx: 22, dy: -42, spin: -160, d: 50, c: "#8ed4e6" },
];

function Confetti({ burst }: { burst: number }) {
  if (burst === 0) return null;
  return (
    <span key={burst} aria-hidden className={styles.confetti}>
      {CONFETTI.map((p, i) => (
        <span
          key={i}
          className={styles.confettiPiece}
          style={
            {
              backgroundColor: p.c,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--spin": `${p.spin}deg`,
              "--d": `${p.d}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
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
      strokeWidth="2"
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
   Front-of-box: the product, presented as retail packaging.
-------------------------------------------------------------------------- */

function ProductBox() {
  return (
    <div className={`${styles.boxScene} px-2 pt-14 pb-4 sm:px-6 sm:pt-16`}>
      <div className={`${styles.box3d} relative mx-auto w-full max-w-[440px]`}>
        {/* Receding top flap — corrugate, because that is what a box is. */}
        <div
          aria-hidden
          className={`${styles.boxTop} ${styles.flute} border-[3px] border-b-0 border-[#2b1c14]`}
        />
        {/* Receding right-hand panel, printed like a spine. */}
        <div
          aria-hidden
          className={`${styles.boxSide} ${styles.grain} flex items-center justify-center border-[3px] border-l-0 border-[#2b1c14] bg-[#c93d09]`}
        >
          <span
            className={`${styles.poster} text-[15px] text-white/90`}
            style={{ writingMode: "vertical-rl" }}
          >
            Growsearch
          </span>
        </div>

        {/* Front face. */}
        <div
          className={`${styles.grain} relative border-[3px] border-[#2b1c14] bg-[#ffe8df] shadow-[var(--soft-3)]`}
        >
          <div className="relative z-[2]">
            <div className="flex items-center justify-between border-b-[3px] border-[#2b1c14] bg-[#d1400a] px-4 py-2 text-white">
              <span
                className={`${styles.mono} text-[10.5px] font-bold tracking-[0.24em] uppercase`}
              >
                Growmerce
              </span>
              <span
                className={`${styles.mono} text-[10.5px] font-bold tracking-[0.24em] uppercase`}
              >
                Aisle 01
              </span>
            </div>

            <div className="px-5 pt-6 pb-5 sm:px-7">
              <h3
                id="shelf-growsearch"
                className={`${styles.poster} -rotate-[1.4deg] text-[clamp(2.5rem,7vw,3.6rem)] text-[#2b1c14]`}
              >
                Growsearch
              </h3>
              <p
                className={`${styles.display} mt-3 max-w-[22rem] text-[16px] leading-snug font-bold text-[#432c20]`}
              >
                Storefront search that never dead-ends — and analytics that
                prove what search sells.
              </p>

              {/* Window onto the product itself. */}
              <div className="mt-5 border-[3px] border-[#2b1c14] bg-[#fffaf5] p-2 shadow-[4px_5px_0_rgba(96,44,14,0.22)]">
                <Image
                  src="/img/smart-search-mock.png"
                  alt=""
                  width={900}
                  height={520}
                  sizes="(max-width: 1024px) 80vw, 400px"
                  className="h-[118px] w-full object-cover object-top sm:h-[140px]"
                />
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p
                    className={`${styles.mono} text-[10px] font-bold tracking-[0.18em] text-[#5a4034] uppercase`}
                  >
                    Net contents
                  </p>
                  <p
                    className={`${styles.display} text-[15px] font-extrabold text-[#2b1c14]`}
                  >
                    1 Shopify storefront
                  </p>
                </div>
                <div className="text-right">
                  <Barcode
                    seed="growsearch-01"
                    bars={34}
                    className="ml-auto h-11 w-[132px]"
                  />
                  <p
                    className={`${styles.mono} mt-1 text-[9.5px] font-bold tracking-[0.28em] text-[#5a4034]`}
                  >
                    GRW·05·0001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Its own website is on the way — as a shelf sticker. */}
          <div className="absolute bottom-[86px] -left-3 z-[3] w-[176px] sm:bottom-[96px]">
            <Sticker
              rot={-5}
              className="rounded-[10px] bg-[#8ed4e6] px-3 py-2 text-center"
            >
              <span
                className={`${styles.mono} block text-[9.5px] leading-tight font-bold tracking-[0.14em] text-[#0f4d5e] uppercase`}
              >
                Coming to a shelf
                <br />
                near you
              </span>
              <span
                className={`${styles.display} mt-0.5 block text-[11px] font-extrabold text-[#2b1c14]`}
              >
                growsearch.com
              </span>
            </Sticker>
          </div>
        </div>

        {/* NEW! flash, stuck on the corner of the box. */}
        <div className="absolute -top-9 -right-4 z-[4] size-[104px] sm:-right-8 sm:size-[118px]">
          <Starburst
            className={`${styles.driftSlow} ${styles.dieCutShadow} size-full bg-[#ffd66e]`}
          >
            <span
              className={`${styles.poster} block text-[19px] text-[#2b1c14] sm:text-[22px]`}
            >
              New!
              <span
                className={`${styles.mono} mt-0.5 block text-[8px] tracking-[0.1em]`}
              >
                On shelves
              </span>
            </span>
          </Starburst>
        </div>
      </div>

      {/* The shelf itself, with the price tag clipped to its lip. */}
      <div className="relative mx-auto mt-6 w-full max-w-[520px]">
        <div
          aria-hidden
          className={`${styles.flute} h-3.5 rounded-[3px] border-[3px] border-[#2b1c14] shadow-[0_10px_18px_-14px_rgba(96,44,14,0.9)]`}
        />
        <div className="mt-[-2px] flex justify-center">
          <span
            aria-hidden
            className="h-5 w-[2px] bg-[#2b1c14]"
          />
        </div>
        <div className="flex justify-center">
          <Link
            href="#"
            className={`${styles.swingOnHover} ${focusRing} group block`}
          >
            <GunTag
              tone="orange"
              className="border-[3px] border-[#2b1c14]"
            >
              <span
                className={`${styles.display} flex items-center gap-2 text-[17px] font-extrabold sm:text-[19px]`}
              >
                Explore Growsearch
                <ChunkyArrow className="size-[17px] transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </span>
              <span
                className={`${styles.mono} mt-0.5 block text-[9.5px] font-bold tracking-[0.16em] uppercase`}
              >
                Shelf tag · aisle 01
              </span>
            </GunTag>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Back-of-box: the four things it does, set as a nutrition panel.
-------------------------------------------------------------------------- */

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

function SearchFacts() {
  return (
    <div
      className={`${styles.grain} rotate-[1.1deg] border-[3px] border-[#2b1c14] bg-[#fffaf5] px-5 py-5 shadow-[7px_9px_0_rgba(96,44,14,0.24)] sm:px-7 sm:py-6`}
    >
      <div className="relative z-[2]">
        <p
          className={`${styles.poster} border-b-[9px] border-[#2b1c14] pb-1 text-[clamp(1.9rem,4vw,2.5rem)] text-[#2b1c14]`}
        >
          Search facts
        </p>
        <p
          className={`${styles.mono} border-b-2 border-[#2b1c14] py-1 text-[12px] font-bold`}
        >
          Serving size: 1 storefront · Servings per store: unlimited
        </p>
        <div
          className={`${styles.mono} flex items-end justify-between border-b-[7px] border-[#2b1c14] pt-1.5 pb-1 text-[11px] font-bold tracking-[0.06em] uppercase`}
        >
          <span>Amount per storefront</span>
          <span>% Daily value*</span>
        </div>

        <ul>
          {FACTS.map((f) => (
            <li
              key={f.name}
              className="border-b border-[#2b1c14]/35 py-3 last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h4
                  className={`${styles.display} text-[16.5px] leading-tight font-extrabold`}
                >
                  {f.name}
                </h4>
                <span
                  className={`${styles.mono} shrink-0 text-[13px] font-bold`}
                >
                  {f.dv}
                </span>
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#5a4034]">
                {f.body}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-1 border-t-[7px] border-[#2b1c14] pt-3">
          <p
            className={`${styles.mono} text-[11.5px] leading-relaxed text-[#5a4034]`}
          >
            * Percent daily value based on one storefront. Contains no
            replatforming, no six-week onboarding and no AI team. Fits the store
            you already run.
          </p>
          <p
            className={`${styles.mono} mt-3 text-[11.5px] leading-relaxed font-bold text-[#2b1c14]`}
          >
            Launching now on the Shopify App Store · WooCommerce next.
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Free samples: the two moments worth demonstrating rather than describing.
-------------------------------------------------------------------------- */

function SampleTable() {
  const [cart, setCart] = useState(0);
  const [burst, setBurst] = useState(0);

  const add = () => {
    setCart((c) => Math.min(c + 1, 9));
    setBurst((b) => b + 1);
  };

  return (
    <div
      className={`${styles.grain} relative border-[3px] border-[#2b1c14] bg-[#fff6ee] p-4 shadow-[7px_9px_0_rgba(96,44,14,0.22)] sm:p-6`}
    >
      <Tape className="absolute -top-4 left-10 z-[3] h-8 w-28 -rotate-[5deg]" />

      <div className="relative z-[2]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span
              className={`${styles.mono} inline-block -rotate-[1.4deg] border-2 border-[#2b1c14] bg-[#ffd66e] px-3 py-1 text-[11px] font-bold tracking-[0.2em] uppercase`}
            >
              Free samples
            </span>
            <p
              className={`${styles.display} mt-3 text-[19px] font-extrabold sm:text-[21px]`}
            >
              Two of those four, working right here.
            </p>
          </div>

          {/* Demo cart — the badge pops, and the button throws confetti. */}
          <div className="relative flex shrink-0 items-center gap-3">
            <span
              className={`${styles.mono} hidden text-[11px] font-bold tracking-[0.16em] text-[#5a4034] uppercase sm:block`}
            >
              Demo
              <br />
              cart
            </span>
            <div className="relative">
              <div
                key={`cart-${cart}`}
                className={`${cart > 0 ? styles.cartNudge : ""} grid size-[54px] place-items-center rounded-[14px] border-[3px] border-[#2b1c14] bg-[#fffaf5] text-[#2b1c14] shadow-[4px_5px_0_rgba(96,44,14,0.3)]`}
              >
                <CartGlyph className="size-6" />
              </div>
              {cart > 0 ? (
                <span
                  key={cart}
                  aria-hidden
                  className={`${styles.badgePop} ${styles.display} absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border-2 border-[#2b1c14] bg-[#d1400a] text-[13px] font-extrabold text-white`}
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
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Sample A — the rescue. */}
          <article className="flex flex-col border-[3px] border-[#2b1c14] bg-[#fffaf5] p-4 sm:p-5">
            <span
              className={`${styles.mono} w-fit border-2 border-[#2b1c14] bg-[#8ed4e6] px-2.5 py-0.5 text-[10.5px] font-bold tracking-[0.16em] uppercase`}
            >
              Sample A · never zero results
            </span>
            <p
              className={`${styles.mono} mt-4 text-[12.5px] font-bold text-[#7a5a48] line-through`}
            >
              0 results for “kava drinks”
            </p>
            <div className="relative mt-2">
              <p className="rounded-[12px] border-2 border-[#2b1c14] bg-[#ffe8df] px-4 py-3 text-[14.5px] leading-snug font-medium text-[#2b1c14]">
                “We don&rsquo;t have kava drinks — but you might like these
                Kratom Seltzers ✨”
              </p>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#5a4034]">
              Typos fixed, intent understood, a real shelf offered instead of an
              apology.
            </p>
          </article>

          {/* Sample B — add to cart, with the confetti burst. */}
          <article className="flex flex-col border-[3px] border-[#2b1c14] bg-[#fffaf5] p-4 sm:p-5">
            <span
              className={`${styles.mono} w-fit border-2 border-[#2b1c14] bg-[#ffd66e] px-2.5 py-0.5 text-[10.5px] font-bold tracking-[0.16em] uppercase`}
            >
              Sample B · buy from search
            </span>

            <div className="mt-4 flex items-center gap-3 rounded-[12px] border-2 border-[#2b1c14] bg-[#fff6ee] p-2.5">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-[9px] border-2 border-[#2b1c14] bg-[#ffd7c5] text-[#d1400a]"
              >
                <Sparkle className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`${styles.display} block truncate text-[14px] font-extrabold text-[#2b1c14]`}
                >
                  Kratom Seltzer · Yuzu
                </span>
                <span
                  className={`${styles.mono} block text-[12px] text-[#5a4034]`}
                >
                  $9.00 · in stock
                </span>
              </span>

              <span className="relative shrink-0">
                <Confetti burst={burst} />
                <button
                  type="button"
                  onClick={add}
                  className={`${styles.springy} ${styles.springySm} ${styles.display} ${focusRing} relative rounded-[10px] border-[3px] border-[#2b1c14] bg-[#2b1c14] px-3.5 py-2 text-[13px] font-extrabold text-white hover:bg-[#d1400a]`}
                >
                  Add
                </button>
              </span>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed text-[#5a4034]">
              Go on — press it. The counter above is the shopper&rsquo;s cart,
              updating without leaving the results.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Still in the stockroom.
-------------------------------------------------------------------------- */

function WrappedUnit({
  unit,
  note,
  rot,
}: {
  unit: string;
  note: string;
  rot: number;
}) {
  return (
    <article
      className={`${styles.kraft} group relative overflow-hidden rounded-[10px] border-[3px] border-[#2b1c14] shadow-[var(--soft-2)]`}
      style={{ transform: `rotate(${rot}deg)` }}
      aria-label={`Unit ${unit} — still packing`}
    >
      {/* Parcel tape down the seam. */}
      <span
        aria-hidden
        className={`${styles.tapeKraft} absolute inset-y-0 left-1/2 w-16 -translate-x-1/2`}
      />

      <div className="relative px-5 py-8 sm:py-10">
        <div className="mx-auto w-fit border-[3px] border-[#2b1c14] bg-[#fffaf5] px-4 py-3 text-center shadow-[4px_5px_0_rgba(96,44,14,0.3)]">
          <p
            className={`${styles.poster} text-[clamp(1.5rem,4vw,2rem)] text-[#2b1c14]`}
          >
            Unit {unit}
          </p>
          <p
            className={`${styles.mono} mt-1 text-[10.5px] font-bold tracking-[0.2em] text-[#d1400a] uppercase`}
          >
            Still packing
          </p>
        </div>

        <p className="mx-auto mt-5 max-w-[19rem] text-center text-[13.5px] leading-relaxed text-[#4a2f1e]">
          {note}
        </p>
      </div>

      {/* Shrink-wrap. It shifts as you lean in, the way plastic catches light. */}
      <span
        aria-hidden
        className={`${styles.shrinkWrap} pointer-events-none absolute -inset-8 transition-transform duration-700 ease-out group-hover:translate-x-6 group-focus-within:translate-x-6`}
      />
    </article>
  );
}

/* --------------------------------------------------------------------------
   Section
-------------------------------------------------------------------------- */

export default function Shelf() {
  return (
    <section
      id="shelf"
      aria-labelledby="shelf-title"
      className="relative px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow="Aisle 01 · in stock"
              eyebrowTone="sky"
              title={
                <span id="shelf-title">
                  One product on the shelf. The rest are still being packed.
                </span>
              }
              lead="Every Growmerce tool gets its own box — its own product, its own price, its own proof. We only print a label once the thing inside it works."
            />
            <p
              className={`${styles.hand} max-w-[15rem] text-[22px] leading-tight text-[#5a4034]`}
            >
              read the back of the box &mdash; the cart is real
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid items-start gap-8 lg:mt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <Reveal>
            <article aria-labelledby="shelf-growsearch">
              <ProductBox />
            </article>
          </Reveal>

          <Reveal delay={120}>
            <SearchFacts />
          </Reveal>
        </div>

        <Reveal delay={80} className="mt-14 lg:mt-16">
          <SampleTable />
        </Reveal>

        {/* The stockroom. */}
        <div className="mt-20 lg:mt-24">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <h3
                className={`${styles.display} text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold`}
              >
                Two more boxes, still taped shut.
              </h3>
              <Stamp tone="ink" rot={-6}>
                Do not open yet
              </Stamp>
            </div>
          </Reveal>

          <div className="mt-9 grid gap-7 sm:grid-cols-2 sm:gap-8">
            <Reveal delay={100}>
              <WrappedUnit
                unit="02"
                rot={-1.4}
                note="Next off the bench. It gets a name when it has customers."
              />
            </Reveal>
            <Reveal delay={180}>
              <WrappedUnit
                unit="03"
                rot={1.2}
                note="On the drawing board. Validated before it is announced."
              />
            </Reveal>
          </div>

          <Reveal delay={120}>
            <p className="mx-auto mt-9 max-w-2xl text-center text-[15px] leading-relaxed text-[#5a4034]">
              New boxes go on the shelf the same way this one did: build fast,
              sell it to real store owners, keep it only if they keep paying.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
