"use client";

import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/site/Reveal";
import styles from "../shopfront.module.css";
import {
  AwningBand,
  ChunkyArrow,
  focusRing,
  SectionHeading,
  Sparkle,
} from "./bits";

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
      className={`${styles.sticker} flex h-full flex-col rounded-[22px] bg-white p-5 shadow-[0_16px_34px_-26px_rgba(96,44,14,0.9)] ring-1 ring-[#2b1c14]/8 ${className ?? ""}`}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ffe8df] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.1em] text-[#eb5213] uppercase">
        {label}
      </span>
      <h4
        className={`${styles.display} mt-3 text-[18px] leading-snug font-bold`}
      >
        {title}
      </h4>
      <div className="mt-2.5 text-[14.5px] leading-relaxed text-[#5a4034]">
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

function GrowsearchShop() {
  const [cart, setCart] = useState(0);

  return (
    <article
      className={`${styles.shopOpen} relative`}
      aria-labelledby="shop-growsearch"
    >
      {/* Hanging signboard over the pavement. */}
      <div className="pointer-events-none absolute -top-1 left-6 z-20 sm:left-10">
        <div className={`${styles.signHang} relative`}>
          <div className="mx-auto flex w-[132px] justify-between px-3">
            <span className={`${styles.strap} h-5 w-[3px] rounded-full`} />
            <span className={`${styles.strap} h-5 w-[3px] rounded-full`} />
          </div>
          <div className="rounded-[14px] border-2 border-[#2b1c14] bg-[#fffaf6] px-4 py-1.5 shadow-[0_10px_18px_-14px_rgba(96,44,14,0.9)]">
            <span
              className={`${styles.display} ${styles.openSign} block text-[15px] font-extrabold tracking-[0.16em] text-[#eb5213] uppercase`}
            >
              Open
            </span>
          </div>
        </div>
      </div>

      <div
        className={`${styles.shopLight} relative overflow-hidden rounded-[34px] bg-[#fffaf6] shadow-[0_30px_60px_-40px_rgba(96,44,14,0.8)] ring-1 ring-[#2b1c14]/10`}
      >
        {/* Warm light spilling from inside on hover. */}
        <div
          aria-hidden
          className={`${styles.shopGlow} pointer-events-none absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(60%_70%_at_50%_100%,rgba(255,167,74,0.42),transparent_70%)]`}
        />

        <AwningBand className="h-12 sm:h-14" />

        <div className="relative px-5 pt-14 pb-6 sm:px-8 sm:pt-16 sm:pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3
                id="shop-growsearch"
                className={`${styles.display} text-[clamp(1.9rem,3.4vw,2.6rem)] leading-none font-extrabold`}
              >
                Growsearch
              </h3>
              <p className="mt-3 max-w-lg text-[15.5px] leading-relaxed text-[#5a4034]">
                Storefront search that never dead-ends — and analytics that
                prove what search sells. For Shopify stores with catalogues
                worth browsing.
              </p>
            </div>

            {/* Shop counter cart — the badge pops when a window card is used. */}
            <div className="relative shrink-0">
              <div
                className={`${cart > 0 ? styles.cartNudge : ""} flex size-[52px] items-center justify-center rounded-full border-2 border-[#2b1c14] bg-white text-[#2b1c14]`}
                key={`cart-${cart}`}
              >
                <CartGlyph className="size-6" />
              </div>
              {cart > 0 ? (
                <span
                  key={cart}
                  aria-hidden
                  className={`${styles.badgePop} ${styles.display} absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-[#ff5c1a] text-[12px] font-extrabold text-white shadow-[0_6px_12px_-6px_rgba(235,82,19,1)]`}
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

          {/* The window display. */}
          <div className="mt-7 grid gap-3.5 sm:grid-cols-2">
            <WindowCard
              label="Never zero results"
              title="Nothing in stock? Offer the next best thing."
            >
              <p className="text-[13px] font-semibold text-[#8a6b58] line-through">
                0 results for “kava drinks”
              </p>
              <p className="mt-1.5 rounded-2xl bg-[#ffe8df] px-3.5 py-2.5 text-[14px] leading-snug font-medium text-[#2b1c14]">
                “We don&rsquo;t have kava drinks — but you might like these
                Kratom Seltzers ✨”
              </p>
              <p className="mt-2 text-[13.5px]">
                Typos fixed, intent understood, a real shelf offered instead of
                an apology.
              </p>
            </WindowCard>

            <WindowCard
              label="Plain language"
              title="Shoppers ask the way they talk."
            >
              <div className="flex flex-wrap gap-2">
                {[
                  "skincare under $10",
                  "warm but not bulky",
                  "gift, arrives friday",
                ].map((q) => (
                  <span
                    key={q}
                    className="rounded-full bg-[#fff4ec] px-3 py-1.5 text-[13px] font-medium text-[#5a4034] ring-1 ring-[#2b1c14]/8"
                  >
                    {q}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[13.5px]">
                Price, attribute and intent are read out of the sentence — no
                filter archaeology required.
              </p>
            </WindowCard>

            <WindowCard
              label="Buy from search"
              title="Add to cart without leaving the results."
            >
              <div className="flex items-center gap-3 rounded-2xl bg-[#fff4ec] p-2.5 ring-1 ring-[#2b1c14]/8">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffd7c5] text-[#eb5213]"
                >
                  <Sparkle className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold text-[#2b1c14]">
                    Kratom Seltzer · Yuzu
                  </span>
                  <span className="block text-[12.5px] text-[#7a5a48]">
                    $9.00 · in stock
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCart((c) => Math.min(c + 1, 9))}
                  className={`${styles.springy} ${styles.display} ${focusRing} shrink-0 rounded-full bg-[#2b1c14] px-3.5 py-2 text-[13px] font-bold text-white hover:bg-[#ff5c1a]`}
                >
                  Add
                </button>
              </div>
              <p className="mt-2.5 text-[13.5px]">
                Try it — the counter above is the shopper&rsquo;s cart, updating
                where they already are.
              </p>
            </WindowCard>

            <WindowCard
              label="Search analytics"
              title="See what search actually sells."
            >
              <div className="flex items-end gap-1.5" aria-hidden>
                {[38, 52, 44, 68, 60, 84, 76].map((h, i) => (
                  <span
                    key={i}
                    className="w-full rounded-t-[4px] bg-[#ff5c1a]"
                    style={{ height: `${h * 0.42}px`, opacity: 0.35 + i * 0.09 }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-[13.5px]">
                Searches tied to checkouts, zero-result terms surfaced as a
                buying list, revenue attributed to the search box.
              </p>
            </WindowCard>
          </div>

          {/* The shop door. */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="#"
              className={`${styles.springy} ${styles.display} ${focusRing} group inline-flex items-center gap-2.5 rounded-full bg-[#ff5c1a] px-7 py-3.5 text-[17px] font-bold text-white shadow-[0_14px_28px_-14px_rgba(235,82,19,0.95)] hover:bg-[#eb5213]`}
            >
              Explore Growsearch
              <ChunkyArrow className="size-[18px] transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Link>

            <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#2b1c14]/25 px-3.5 py-2 text-[13px] font-semibold text-[#7a5a48]">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-[#ffcf6b] ring-4 ring-[#ffcf6b]/25"
              />
              Its own website is opening soon
            </span>
          </div>

          <p className="mt-4 text-[13.5px] font-semibold text-[#7a5a48]">
            Launching now on the Shopify App Store · WooCommerce next.
          </p>
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
      <div className="relative overflow-hidden rounded-[30px] bg-[#f7e6db] shadow-[0_22px_46px_-34px_rgba(96,44,14,0.85)] ring-1 ring-[#2b1c14]/10">
        <AwningBand deep className="h-9 opacity-45" />

        <div className="relative px-4 pt-12 pb-5 sm:px-5">
          <p
            className={`${styles.display} text-[15px] font-extrabold tracking-[0.16em] text-[#8a6b58] uppercase`}
          >
            Unit {unit}
          </p>

          {/* The shutter itself lifts a little when you come close. */}
          <div className="relative mt-3 h-[168px] overflow-hidden rounded-[18px] ring-1 ring-[#2b1c14]/10 sm:h-[196px]">
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
                className={`${styles.hand} rounded-full bg-[#2b1c14] px-3 py-1 text-[16px] leading-tight text-[#ffe8df] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100`}
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
                className={`${styles.display} block rounded-[10px] border-2 border-[#2b1c14]/70 bg-[#fffaf6] px-3 py-1 text-[12.5px] font-extrabold tracking-[0.1em] text-[#2b1c14]/75 uppercase`}
              >
                Opening soon
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[13px] leading-snug text-[#7a5a48]">
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

export default function HighStreet() {
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
              className={`${styles.hand} max-w-[15rem] text-[21px] leading-tight text-[#7a5a48]`}
            >
              have a look in the window &mdash; the cart is real
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 items-end gap-5 sm:gap-6 lg:mt-16 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal className="col-span-2 lg:col-span-1">
            <GrowsearchShop />
          </Reveal>

          <Reveal delay={120}>
            <ShutteredShop
              unit="02"
              note="Next on the street. It gets a name when it has customers."
            />
          </Reveal>

          <Reveal delay={200}>
            <ShutteredShop
              unit="03"
              note="On the drawing board. Validated before it is announced."
            />
          </Reveal>
        </div>

        {/* Pavement. */}
        <div aria-hidden className="mt-6">
          <div className={`${styles.shelf} h-3 rounded-full`} />
          <div className="mt-1.5 h-px w-full bg-[#2b1c14]/8" />
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-center text-[15px] leading-relaxed text-[#7a5a48]">
          New shops go up the same way this one did: build fast, sell it to real
          store owners, keep it only if they keep paying.
        </p>
      </div>
    </section>
  );
}
