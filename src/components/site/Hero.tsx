import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { GROWSEARCH_DEMO } from "@/lib/site-urls";

const CANDLES = [
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

/* Decorative market chart from the Figma hero card, drawn as SVG so it stays
   crisp. Candles alternate charcoal/orange over peach gridlines.

   `wide` spreads the candles apart instead of squashing them, which is how a
   1.9:1 chart becomes a 3.2:1 band without the candles losing their shape —
   flattening the y axis buries every wick inside its own body. The mobile
   hero wants a band: at its native proportions a full-width chart card is
   taller than the photograph it sits under. */
function CandleChart({ className, wide = false }: { className?: string; wide?: boolean }) {
  const spread = wide ? 1.7 : 1;
  const w = 336 * spread;
  return (
    <svg viewBox={`0 0 ${w} 180`} fill="none" aria-hidden className={className}>
      {[24, 60, 96, 132, 168].map((y) => (
        <line key={y} x1="4" x2={w - 4} y1={y} y2={y} stroke="#FFD6C2" strokeWidth="1.5" />
      ))}
      {CANDLES.map((c) => (
        <g key={c.x} stroke={c.up ? "#FF5A1F" : "#171717"} fill={c.up ? "#FF5A1F" : "#171717"}>
          <line x1={c.x * spread + 10} x2={c.x * spread + 10} y1={c.high} y2={c.low} strokeWidth="2.5" />
          <rect x={c.x * spread} y={c.open} width="20" height={Math.max(6, c.close - c.open)} rx="2.5" />
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
    <section className="relative overflow-hidden pb-12 lg:pt-4 lg:pb-28">
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

        {/* Mobile is its own hero, not the stage rearranged.
            ------------------------------------------------------------------
            The desktop composition is a collage that needs width: three
            headline blocks stepping around a photo cut out to receive them.
            One column cannot hold that, so the same idea is turned inside
            out. The orange block becomes the section rather than sitting in
            it, the type is white inside it, and the last line inverts to
            white-on-orange so the block motif still has a voice. The photo
            interlocks by riding up over the panel's bottom edge — the same
            job the cut-out notch does on desktop, done the way a single
            column can do it. */}
        <div className="-mx-6 lg:hidden">
          {/* Square foot on purpose: the photo straddles this edge, and a
              rounded one would have its curve sliced off by the crossing. */}
          <div className="bg-brand px-6 pt-9 pb-24">
            {/* The floor has to stay under the vw term at 320px, or it wins
                there and the last line — the only one paying for a block's
                padding on top of its own width — wraps inside the block. */}
            <h1 className="font-poppins text-[clamp(1.75rem,9.4vw,3.5rem)] leading-[1.06] font-extrabold tracking-[-0.02em] text-white">
              <span className="hero-enter block">The high street</span>
              <span className="hero-enter block" style={{ animationDelay: "70ms" }}>
                of AI tools
              </span>
              <span
                className="hero-enter mt-1.5 block w-fit rounded-[14px] bg-white px-4 pb-[0.08em] text-brand"
                style={{ animationDelay: "140ms" }}
              >
                for ecommerce.
              </span>
            </h1>

            <p
              className="hero-enter mt-6 max-w-[30ch] text-[clamp(1.0625rem,4.3vw,1.2rem)] leading-snug text-white/85"
              style={{ animationDelay: "230ms" }}
            >
              Growmerce turns search into sales by understanding what shoppers
              actually ask for.
            </p>

            {/* Below 360px the pair no longer fits on one row, and two
                left-aligned buttons of different widths look like a mistake —
                so they go full width there instead. */}
            <div className="hero-enter mt-7 flex flex-wrap gap-3" style={{ animationDelay: "310ms" }}>
              <Link href={GROWSEARCH_DEMO} className="cta-primary-inverse max-[359px]:w-full">
                See demo
              </Link>
              <Link href="#trial" className="cta-secondary-inverse max-[359px]:w-full">
                Try it free
              </Link>
            </div>
          </div>

          {/* The photo is cut out for the desktop stage, so the crop starts
              below its transparent corner. It rides up onto the panel, and
              the chart hangs off its far corner — two overlaps instead of
              three tiles stacked in a column. */}
          <div className="hero-enter-scale relative -mt-16 px-6" style={{ animationDelay: "380ms" }}>
            <div className="overflow-hidden rounded-[18px] shadow-[0_26px_50px_-28px_rgba(96,44,14,0.6)]" style={{ aspectRatio: "712 / 354" }}>
              <Image
                src="/img/pages/hero-shopping-desk.png"
                alt="A shopping trolley of parcels on a desk beside a laptop showing an online store"
                width={712}
                height={534}
                sizes="100vw"
                className="h-full w-full origin-bottom scale-[1.04] object-cover object-bottom"
              />
            </div>

            <div className="absolute right-6 -bottom-8 w-[58%] rounded-[18px] bg-[#fae2d2] px-4 py-3 shadow-[0_18px_36px_-20px_rgba(96,44,14,0.7)] ring-4 ring-white">
              <CandleChart wide className="h-auto w-full" />
            </div>
          </div>
          {/* Clears the chart card's overhang. */}
          <div aria-hidden className="h-8" />
        </div>
      </div>
    </section>
  );
}
