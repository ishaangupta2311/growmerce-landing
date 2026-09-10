import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import DemoStoreButton from "./DemoStoreButton";

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
   block, and headline to the mockup card. Because the collage's cut-out is
   baked into the asset, its own proportions drive the rest: the block height
   equals the notch depth, and the collage's arm width places the middle block.
   Keep `public/img/pages/hero-search-mockup.png` and these numbers in step —
   the asset is 712x534 with a 336px arm and a 180px notch.

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
          {/* The cut-out collage. Its top edge sits a gutter below the first
              block and its notch a gutter below the second, which the asset's
              own proportions guarantee at every width. */}
          <Image
            src="/img/pages/hero-search-mockup.png"
            alt="A Growmerce search for “gift for someone who loves coffee” returning coffee products, beside a trolley of parcels"
            width={712}
            height={534}
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="hero-enter-scale absolute h-auto [filter:drop-shadow(0_14px_26px_rgba(96,44,14,0.13))]"
            style={{
              left: `${PHOTO.left}cqw`,
              top: `${TOP + BAR_H + GUTTER}cqw`,
              width: `${PHOTO.width}cqw`,
              animationDelay: "150ms",
            }}
          />

          {/* The laptop, cut out rather than sitting on a card: a gutter clear
              of the first block's right edge, and running out to the stage's
              own right edge — the same line the subtext below it ends on. Its
              height follows from the asset, which keeps a gutter's worth of
              air above the last block. */}
          <Image
            src="/img/pages/hero-revenue-macbook.png"
            alt="A laptop showing search revenue climbing to $142,592"
            width={495}
            height={333}
            priority
            sizes="(min-width: 1024px) 28vw, 60vw"
            className="hero-enter-scale absolute h-auto"
            style={{
              left: `${BARS[0].left + BARS[0].width + GUTTER}cqw`,
              top: `${TOP}cqw`,
              width: `${100 - (BARS[0].left + BARS[0].width + GUTTER)}cqw`,
              animationDelay: "230ms",
            }}
          />

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
              <DemoStoreButton className="cta-primary" source="home-hero-desktop" />
              <Link href="/try" className="cta-secondary">
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
              <DemoStoreButton
                className="cta-primary-inverse max-[359px]:w-full"
                source="home-hero-mobile"
              />
              <Link href="/try" className="cta-secondary-inverse max-[359px]:w-full">
                Try it free
              </Link>
            </div>
          </div>

          {/* The collage is cut out for the desktop stage, so the crop starts
              below its transparent corner — which lands exactly on the search
              mockup, the half of the collage worth showing in one column. It
              rides up onto the panel, and the laptop hangs off its far corner
              — two overlaps instead of three tiles stacked in a column. */}
          <div className="hero-enter-scale relative -mt-16 px-6" style={{ animationDelay: "380ms" }}>
            {/* Cut-out art, so the crop box carries no card of its own — the
                shadow hangs off the mockup's own edges instead. */}
            <div style={{ aspectRatio: "712 / 354" }}>
              <Image
                src="/img/pages/hero-search-mockup.png"
                alt="A Growmerce search for “gift for someone who loves coffee” returning coffee products"
                width={712}
                height={534}
                sizes="100vw"
                className="h-full w-full object-cover object-bottom [filter:drop-shadow(0_14px_24px_rgba(96,44,14,0.16))]"
              />
            </div>

            <Image
              src="/img/pages/hero-revenue-macbook.png"
              alt="A laptop showing search revenue climbing to $142,592"
              width={495}
              height={333}
              sizes="54vw"
              className="absolute right-3 -bottom-10 h-auto w-[54%]"
            />
          </div>
          {/* Clears the laptop's overhang. */}
          <div aria-hidden className="h-10" />
        </div>
      </div>
    </section>
  );
}
