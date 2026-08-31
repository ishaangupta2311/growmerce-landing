import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { GROWSEARCH_DEMO } from "@/lib/site-urls";

/* Decorative market chart from the Figma hero card, drawn as SVG so it stays
   crisp. Candles alternate charcoal/orange over peach gridlines. */
function CandleChart({ className }: { className?: string }) {
  const candles = [
    { x: 16, open: 112, close: 150, low: 158, high: 96, up: false },
    { x: 52, open: 84, close: 128, low: 140, high: 70, up: false },
    { x: 88, open: 82, close: 126, low: 138, high: 68, up: false },
    { x: 124, open: 44, close: 92, low: 104, high: 30, up: true },
    { x: 160, open: 24, close: 66, low: 78, high: 12, up: false },
    { x: 196, open: 62, close: 104, low: 116, high: 50, up: false },
    { x: 232, open: 34, close: 74, low: 86, high: 22, up: true },
    { x: 268, open: 70, close: 118, low: 130, high: 58, up: true },
    { x: 304, open: 30, close: 78, low: 92, high: 18, up: true },
  ];
  return (
    <svg viewBox="0 0 336 180" fill="none" aria-hidden className={className}>
      {[24, 60, 96, 132, 168].map((y) => (
        <line key={y} x1="4" x2="332" y1={y} y2={y} stroke="#FFD6C2" strokeWidth="1.5" />
      ))}
      {candles.map((c) => (
        <g key={c.x} stroke={c.up ? "#FF5A1F" : "#171717"} fill={c.up ? "#FF5A1F" : "#171717"}>
          <line x1={c.x + 10} x2={c.x + 10} y1={c.high} y2={c.low} strokeWidth="2.5" />
          <rect x={c.x} y={c.open} width="20" height={Math.max(6, c.close - c.open)} rx="2.5" />
        </g>
      ))}
    </svg>
  );
}

/* Where two blocks of the staircase meet, the outline turns back on itself.
   `border-radius` can only round a corner outward, so the inward arc is drawn
   instead: a small orange tile with a transparent disc bitten out of one
   corner. Positioned against the corner of the lower block, it reads as one
   continuous filleted edge. */
function InsetCorner({ disc, style }: { disc: "bottom left" | "top right"; style: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        width: "var(--inset)",
        height: "var(--inset)",
        background: `radial-gradient(circle at ${disc}, transparent calc(var(--inset) - 0.5px), var(--color-brand) var(--inset))`,
        ...style,
      }}
    />
  );
}

/* Desktop hero geometry, all of it in `cqw` against the stage.
   ------------------------------------------------------------------
   The composition is a staircase of three headline blocks with the photo
   tucked into the step on the left, and one gutter width repeated at every
   place the two shapes pass each other — headline to photo top, photo arm to
   the middle block, middle block to the photo's notch, photo to the last
   block, and headline to the chart card. Because the photo's cut-out is baked
   into the asset, its own proportions drive the rest: the block height equals
   the notch depth, and the photo's arm width places the middle block. Keep
   `public/img/pages/hero-shopping-desk.png` and these numbers in step — the
   asset is 712x534 with a 336px arm and a 180px notch.

   Everything is a container-query unit rather than `vw` so the type and the
   boxes stay locked to each other: sized in `vw` they drift apart once the
   1370px container stops growing, which is what left the blocks looking far
   too tall for the words inside them. */
const GUTTER = 3.0;
const BAR_H = 10.77; // = the photo's notch depth, and 1.5x the type size
// Headline size. Tailwind needs the literal in the class below, so the two
// have to be changed together.
const TYPE = 7.18;
const PAD = 0.27 * TYPE;
const TOP = 5.2;
const RIGHT = 97.4; // right edge of the last block and of the chart card

const PHOTO = { left: 2.2, width: 42.6, height: 31.95 };
const BARS = [
  { text: "The high street of", left: 2.2, width: 67.92, radius: "1.3cqw 1.3cqw 0 1.3cqw", delay: 0 },
  { text: "AI tools for", left: 25.3, width: 44.82, radius: "0 0 0 1.3cqw", delay: 90 },
  { text: "ecommerce.", left: 47.8, width: 49.6, radius: "0 1.3cqw 1.3cqw 1.3cqw", delay: 180 },
];

/* The stage ends flush with the photo and the buttons, so the gap down to the
   platform strip is all padding. Keep it clearly wider than the gutter inside
   the composition, or the strip reads as part of it. */
export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-4 lg:pb-28">
      <div className="mx-auto w-full max-w-[1370px] px-6">
        {/* Desktop: an absolutely-composed stage. `@container` makes it the
            reference box for every `cqw` below. */}
        <div
          className="@container relative hidden w-full lg:block"
          style={{ aspectRatio: `100 / ${TOP + BAR_H + GUTTER + PHOTO.height}`, "--inset": "0.87cqw" } as CSSProperties}
        >
          {/* The cut-out photo. Its top edge sits a gutter below the first
              block and its notch a gutter below the second, which the asset's
              own proportions guarantee at every width. */}
          <Image
            src="/img/pages/hero-shopping-desk.png"
            alt="A shopping trolley of parcels on a desk beside a laptop showing an online store"
            width={712}
            height={534}
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="hero-enter-scale absolute h-auto"
            style={{
              left: `${PHOTO.left}cqw`,
              top: `${TOP + BAR_H + GUTTER}cqw`,
              width: `${PHOTO.width}cqw`,
              animationDelay: "150ms",
            }}
          />

          {/* Chart card — a gutter clear of the first block's right edge and of
              the last block's top edge, so it sits in the same grid. */}
          <div
            className="hero-enter-scale absolute rounded-[1.3cqw] bg-[#fae2d2] p-[1.2cqw]"
            style={{
              left: `${BARS[0].left + BARS[0].width + GUTTER}cqw`,
              top: `${TOP}cqw`,
              width: `${RIGHT - (BARS[0].left + BARS[0].width + GUTTER)}cqw`,
              height: `${2 * BAR_H - GUTTER}cqw`,
              animationDelay: "230ms",
            }}
          >
            <CandleChart className="h-full w-full" />
          </div>

          {/* The three headline blocks. Each is exactly one line box tall, so
              the block hugs the words rather than floating in the middle of a
              deep bar. */}
          <h1 className="contents font-poppins font-extrabold tracking-[-0.02em] text-white">
            {BARS.map((b, i) => (
              <span
                key={b.text}
                className="hero-enter absolute flex items-center bg-brand px-[0.27em] text-[7.18cqw] leading-none"
                style={{
                  left: `${b.left}cqw`,
                  top: `${TOP + i * BAR_H}cqw`,
                  width: `${b.width}cqw`,
                  height: `${BAR_H}cqw`,
                  borderRadius: b.radius,
                  animationDelay: `${b.delay}ms`,
                }}
              >
                {b.text}
                {/* Fillets, carried by the lower block of each pair so they
                    travel with it through the entrance stagger. */}
                {i > 0 && <InsetCorner disc="bottom left" style={{ left: "calc(-1 * var(--inset))", top: 0 }} />}
                {i === 2 && (
                  <InsetCorner
                    disc="top right"
                    style={{
                      left: `${BARS[1].left + BARS[1].width - b.left}cqw`,
                      top: "calc(-1 * var(--inset))",
                    }}
                  />
                )}
              </span>
            ))}
          </h1>

          {/* Subtext and CTAs hang off the bottom of the stage, which is the
              photo's baseline — so the buttons stay level with the bottom of
              the photo whatever the CTAs measure. */}
          {/* The CTAs keep a fixed size while the stage scales, so the column
              tightens its own spacing before it can crowd the last block. */}
          <div
            className="absolute bottom-0 flex flex-col gap-4 xl:gap-7"
            style={{ left: `${BARS[2].left + PAD}cqw`, right: 0 }}
          >
            <p
              className="hero-enter text-[clamp(1rem,1.65vw,1.5rem)] leading-snug text-body-mute"
              style={{ animationDelay: "300ms" }}
            >
              Growmerce turns search into sales by understanding what shoppers
              actually ask for.
            </p>

            <div
              className="hero-enter flex items-center gap-4"
              style={{ animationDelay: "380ms" }}
            >
              <Link href={GROWSEARCH_DEMO} className="cta-primary">
                See demo
              </Link>
              <Link href="#trial" className="cta-secondary">
                Try it free
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: stacked blocks, photo below, chart last. */}
        <div className="lg:hidden">
          <h1 className="font-poppins font-bold tracking-[-0.02em] text-white">
            {["The high street of", "AI tools for", "ecommerce."].map((line, i) => (
              <span
                key={line}
                className={`hero-enter block w-fit rounded-[10px] bg-brand px-4 pt-2 pb-3 text-[clamp(2.15rem,8.6vw,3.4rem)] leading-[1.02] ${i > 0 ? "mt-2" : ""} ${i === 1 ? "ml-6" : ""}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p className="hero-enter mt-6 text-[clamp(1.0625rem,4.4vw,1.25rem)] leading-snug text-body-mute" style={{ animationDelay: "300ms" }}>
            Growmerce turns search into sales by understanding what shoppers
            actually ask for.
          </p>

          <div className="hero-enter mt-6 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
            <Link href={GROWSEARCH_DEMO} className="cta-primary">
              See demo
            </Link>
            <Link href="#trial" className="cta-secondary">
              Try it free
            </Link>
          </div>

          <Image
            src="/img/pages/hero-shopping-desk.png"
            alt="A shopping trolley of parcels on a desk beside a laptop showing an online store"
            width={712}
            height={534}
            sizes="100vw"
            className="hero-enter-scale mt-8 h-auto w-full"
            style={{ animationDelay: "200ms" }}
          />

          <div className="mt-4 rounded-[20px] bg-peach/60 p-4">
            <CandleChart className="h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
