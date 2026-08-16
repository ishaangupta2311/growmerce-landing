"use client";

import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/site/Reveal";
import styles from "../nightmarket.module.css";
import { AwningBand, ChunkyArrow, focusRing, SectionHeading, Sparkle } from "./bits";
import { NeonPlate, Skyline, StringLights } from "./scenery";
import Torch from "./Torch";

/* --------------------------------------------------------------------------
   Window display: the four things Growsearch does, as backlit display cases.
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
      className={`${styles.vitrine} flex h-full flex-col rounded-[22px] p-5 ${className ?? ""}`}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ff5c1a]/18 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.1em] text-[#ffb27a] uppercase ring-1 ring-[#ff8a3c]/30">
        {label}
      </span>
      <h4
        className={`${styles.display} mt-3 text-[18px] leading-snug font-bold text-[#fff2e4]`}
      >
        {title}
      </h4>
      <div className="mt-2.5 text-[14.5px] leading-relaxed text-[#e3cab4]">
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
   The one lit shop on the street
-------------------------------------------------------------------------- */

function GrowsearchShop() {
  const [cart, setCart] = useState(0);

  return (
    <article
      className={`${styles.shopOpen} relative isolate`}
      aria-labelledby="shop-growsearch"
    >
      {/* Neon sign hung over the pavement. */}
      <NeonPlate className="pointer-events-none absolute -top-2 left-6 z-30 w-[128px] sm:left-10 sm:w-[140px]">
        Open
      </NeonPlate>

      {/* Everything the shop throws onto the street. */}
      <div
        aria-hidden
        className={`${styles.shopGlow} pointer-events-none absolute -inset-x-8 -top-10 bottom-[-70px] -z-10 rounded-[80px] bg-[radial-gradient(60%_60%_at_50%_60%,rgba(255,150,70,0.28),transparent_72%)]`}
      />
      <div
        aria-hidden
        className={`${styles.spill} pointer-events-none absolute inset-x-[-6%] top-full h-[110px]`}
      />

      <div
        className={`${styles.shopLight} relative overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,#452b1a_0%,#301e13_56%,#251710_100%)] shadow-[0_36px_70px_-40px_rgba(0,0,0,0.95),0_0_90px_-30px_rgba(255,146,62,0.5)] ring-1 ring-[#ffc46b]/25`}
      >
        {/* Light pouring down the inside of the window. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 h-64 bg-[radial-gradient(58%_70%_at_50%_0%,rgba(255,186,116,0.34),transparent_72%)]"
        />

        <AwningBand className="h-12 sm:h-14" />

        <div className="relative px-5 pt-14 pb-6 sm:px-8 sm:pt-16 sm:pb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3
                id="shop-growsearch"
                className={`${styles.display} ${styles.neonAmber} text-[clamp(1.9rem,3.4vw,2.6rem)] leading-none font-extrabold`}
              >
                Growsearch
              </h3>
              <p className="mt-3 max-w-lg text-[15.5px] leading-relaxed text-[#e3cab4]">
                Storefront search that never dead-ends — and analytics that
                prove what search sells. For Shopify stores with catalogues
                worth browsing.
              </p>
            </div>

            {/* Counter cart — the badge pops when a display case is used. */}
            <div className="relative shrink-0">
              <div
                className={`${cart > 0 ? styles.cartNudge : ""} ${styles.tubeAmber} flex size-[52px] items-center justify-center rounded-full bg-[#20140c] text-[#ffc46b]`}
                key={`cart-${cart}`}
              >
                <CartGlyph className="size-6" />
              </div>
              {cart > 0 ? (
                <span
                  key={cart}
                  aria-hidden
                  className={`${styles.badgePop} ${styles.display} absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-[#ff5c1a] text-[12px] font-extrabold text-[#20140c] shadow-[0_0_14px_rgba(255,92,26,0.95)]`}
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
              <p className="text-[13px] font-semibold text-[#a1866f] line-through">
                0 results for “kava drinks”
              </p>
              <p className="mt-1.5 rounded-2xl bg-[#ff5c1a]/16 px-3.5 py-2.5 text-[14px] leading-snug font-medium text-[#fff2e4] ring-1 ring-[#ff8a3c]/25">
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
                    className="rounded-full bg-[#20140c]/70 px-3 py-1.5 text-[13px] font-medium text-[#e3cab4] ring-1 ring-[#ffc46b]/20"
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
              <div className="flex items-center gap-3 rounded-2xl bg-[#20140c]/70 p-2.5 ring-1 ring-[#ffc46b]/18">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ff5c1a]/20 text-[#ffb27a] ring-1 ring-[#ff8a3c]/30"
                >
                  <Sparkle className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] leading-tight font-bold text-balance text-[#fff2e4]">
                    Kratom Seltzer · Yuzu
                  </span>
                  <span className="mt-0.5 block text-[12.5px] whitespace-nowrap text-[#bda28c]">
                    $9.00 · in stock
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCart((c) => Math.min(c + 1, 9))}
                  className={`${styles.springy} ${styles.display} ${focusRing} shrink-0 rounded-full bg-[#ff5c1a] px-3.5 py-2 text-[13px] font-bold text-[#20140c] shadow-[0_0_18px_-2px_rgba(255,92,26,0.8)] hover:bg-[#ffc46b]`}
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
                    className="w-full rounded-t-[4px] bg-[#ff8a3c] shadow-[0_0_10px_rgba(255,138,60,0.55)]"
                    style={{ height: `${h * 0.42}px`, opacity: 0.4 + i * 0.09 }}
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
              className={`${styles.springy} ${styles.display} ${focusRing} group inline-flex items-center gap-2.5 rounded-full bg-[#ff5c1a] px-7 py-3.5 text-[17px] font-bold text-[#20140c] shadow-[0_0_34px_-6px_rgba(255,92,26,0.95)] hover:bg-[#ff7a33]`}
            >
              Explore Growsearch
              <ChunkyArrow className="size-[18px] transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Link>

            <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#ffc46b]/30 px-3.5 py-2 text-[13px] font-semibold text-[#bda28c]">
              <span
                aria-hidden
                className={`${styles.breathe} size-1.5 rounded-full bg-[#ffc46b] shadow-[0_0_8px_rgba(255,196,107,0.9)] ring-4 ring-[#ffc46b]/20`}
              />
              Its own website is opening soon
            </span>
          </div>

          <p className="mt-4 text-[13.5px] font-semibold text-[#bda28c]">
            Launching now on the Shopify App Store · WooCommerce next.
          </p>
        </div>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------------------
   The units still shuttered — dark, but somebody is in there working.
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
        className={`${styles.panel} relative overflow-hidden rounded-[30px]`}
      >
        <AwningBand tone="deep" className="h-9" />

        <div className="relative px-4 pt-12 pb-5 sm:px-5">
          <p
            className={`${styles.sign} text-[19px] leading-none text-[#a1866f]`}
          >
            Unit {unit}
          </p>

          {/* The shutter, with a sliver of light escaping under it. */}
          <div className="relative mt-3 h-[168px] overflow-hidden rounded-[18px] ring-1 ring-[#ffc46b]/12 sm:h-[196px]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(255,160,80,0.4),rgba(20,12,7,0.9)_72%)]"
            />
            <div
              aria-hidden
              className={`${styles.shutter} ${styles.shutterLift} absolute inset-0`}
            />
            <div
              aria-hidden
              className={`${styles.underLight} absolute inset-x-4 bottom-0 h-5`}
            />
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <span
                className={`${styles.hand} rounded-full bg-[#20140c] px-3 py-1 text-[16px] leading-tight text-[#ffc46b] opacity-0 ring-1 ring-[#ffc46b]/35 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100`}
              >
                psst — soon
              </span>
            </div>
          </div>

          {/* Unlit "opening soon" plate. */}
          <div className="mt-4 flex justify-center">
            <div className={`${styles.swingOnHover} text-center`}>
              <div aria-hidden className="mx-auto flex w-16 justify-between px-1">
                <span className={`${styles.strap} h-3.5 w-[2px] rounded-full`} />
                <span className={`${styles.strap} h-3.5 w-[2px] rounded-full`} />
              </div>
              <span
                className={`${styles.sign} block rounded-[10px] border border-[#ffc46b]/25 bg-[#231710] px-3 py-1 text-[15px] leading-none text-[#bda28c]`}
              >
                Opening soon
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[13px] leading-snug text-[#a1866f]">
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
      className="relative isolate px-5 py-20 sm:px-8 lg:py-28"
    >
      <Torch />

      <div className="mx-auto w-full max-w-[1280px]">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow="the high street, after hours"
              title={
                <span id="high-street-title">
                  One shop lit. More being built.
                </span>
              }
              lead="Every Growmerce tool gets its own shopfront — its own product, its own price, its own proof. We only switch a sign on once the thing behind it works."
            />
            <p
              className={`${styles.hand} max-w-[15rem] text-[21px] leading-tight text-[#bda28c]`}
            >
              have a look in the window &mdash; the cart is real
            </p>
          </div>
        </Reveal>

        <div className="relative mt-24 lg:mt-28">
          {/* The rest of the block: dark upper storeys behind the shops, with
              a strand of lights slung across the street in front of them. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-8%] -top-10 -z-10 hidden h-[700px] [mask-image:linear-gradient(90deg,transparent_0%,#000_7%,#000_93%,transparent_100%)] lg:block"
          >
            <div className="absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(70%_100%_at_60%_100%,rgba(255,138,60,0.18),transparent_72%)]" />
            <Skyline className="absolute inset-x-0 top-0 h-[300px] w-full" />
            {/* the front of those same buildings, running down behind the
                shops that occupy their ground floors */}
            <div className="absolute inset-x-0 top-[298px] bottom-0 bg-[linear-gradient(180deg,#0a0603_0%,#0a0603_88%,transparent_100%)]" />
          </div>

          <StringLights
            className="absolute inset-x-[-2%] -top-16 z-30 w-[104%]"
            swags={4}
            height={76}
          />

          <div className="grid grid-cols-2 items-end gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
        </div>

        {/* Pavement, lit unevenly by the one shop that is open. */}
        <div aria-hidden className="relative mt-8">
          <div className={`${styles.pavement} h-4 rounded-full`} />
          <div className="mt-1.5 h-px w-full bg-[#ffc46b]/12" />
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] leading-relaxed text-[#bda28c]">
          New shops go up the same way this one did: build fast, sell it to real
          store owners, keep it only if they keep paying.
        </p>
      </div>
    </section>
  );
}
