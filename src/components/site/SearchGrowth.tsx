import Image from "next/image";
import { Sparkle } from "./Marks";
import Reveal from "./Reveal";

type GlyphProps = { className?: string };

/** A shopper with a magnifier — what the query meant, not what it said. */
function IntentGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M10.4 3.2a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8ZM3.6 20.4c0-3.3 3-5.6 6.8-5.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16.4" cy="16" r="3.9" stroke="currentColor" strokeWidth="1.7" />
      <path d="m19.4 19 1.9 1.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** A target — the gaps worth aiming at. */
function TargetGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <path
        d="M12 1.4v2.6M12 20v2.6M22.6 12H20M4 12H1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Bars climbing — discovery that gets better rather than busier. */
function DiscoveryGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M3.4 20.6h17.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M6.6 20.6v-5.4M11.4 20.6V9.8M16.2 20.6v-8.2M21 20.6V5.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3.4 11.2 8 6.6l3.2 3.2L18.6 2.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}

const CARDS = [
  {
    icon: IntentGlyph,
    title: "Understand Shopper Intent",
    blurb: "Know what customers are actually looking for.",
    points: [
      "Understand natural language searches",
      "Identify customer expectations",
      "Go beyond keyword matching",
    ],
  },
  {
    icon: TargetGlyph,
    title: "Discover Hidden Opportunities",
    blurb: "Find where your store can improve.",
    points: ["Discover zero-result searches", "Identify missing products", "Find search gaps"],
  },
  {
    icon: DiscoveryGlyph,
    title: "Improve Product Discovery",
    blurb: "Help shoppers find the right products faster.",
    points: ["Better product matching", "Relevant recommendations", "Smarter search journeys"],
  },
];

function Check({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className}>
      <circle cx="10" cy="10" r="8.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m6.4 10.3 2.5 2.5 4.7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepCard({ card }: { card: (typeof CARDS)[number] }) {
  const Glyph = card.icon;
  return (
    <article className="relative rounded-[16px] bg-gradient-to-br from-white to-cream p-5 shadow-[0_18px_44px_-28px_rgba(96,44,14,0.55)] ring-1 ring-peach/70 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-brand ring-1 ring-peach">
          <Glyph className="size-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[19px] leading-tight font-bold">{card.title}</h3>
          <p className="mt-1 text-[15.5px] text-body-mute">{card.blurb}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {card.points.map((point) => (
          <li key={point} className="flex items-center gap-2.5 text-[15px] text-body-mute">
            <Check className="size-[18px] shrink-0 text-brand" />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

/* The dashed route Figma threads between the three cards.

   Pure decoration, and it only exists where the cards actually sit apart from
   each other — below lg they stack in one column with nothing to cross. The
   viewBox is the section's own box, 100 wide by the 78 units its height works
   out to, and it is stretched rather than kept square so each end stays on the
   card it points at however wide the column gets. The coordinates were read
   off the laid-out cards, so they move if the card widths or the row gaps do.
   Stroke and dashes are in those same units, which is why they are fractions
   rather than pixels. */
function Route() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 78"
      fill="none"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 hidden size-full lg:block"
    >
      <g
        stroke="var(--color-brand)"
        strokeWidth="0.38"
        strokeLinecap="round"
        strokeDasharray="1.3 1.1"
      >
        {/* card 1 → card 2 */}
        <path d="M44 39.6C53 41.5 51 42.5 56.5 44.9" />
        {/* card 2 → card 3, the long hump back across the column */}
        <path d="M47 59.2C38 63.8 26 59.5 22 62.8" />
        {/* card 3 → the mark. The run has to stay inside the box: the section
            ends on the last card, so a sweep that dips under it is clipped. */}
        <path d="M55 73.6C63 77.4 71 77.8 77.4 75.2" />
      </g>
    </svg>
  );
}

export default function SearchGrowth() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-24">
      {/* One positioning context for the whole section so the dashed route can
          run from the first card, which sits up beside the mock, down to the
          last one. */}
      <div className="relative">
        <Route />

        {/* Three cells on a desk: heading, mock, first card. The mock spans
            both rows, which is what tucks the first card up under the
            paragraph instead of leaving a column of white beside it. */}
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12">
          <Reveal className="relative">
            <p className="inline-block rounded-[7px] bg-peach px-3.5 py-2 font-poppins text-[13px] font-extrabold tracking-[0.02em] text-brand uppercase">
              Search that drives growth
            </p>
            <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.35rem)] leading-[1.16] font-bold">
              Turn every search into{" "}
              <span className="text-brand-bright">a growth opportunity.</span>
            </h2>
            <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-body-mute">
              Every search contains valuable customer intent. Growsearch helps
              ecommerce teams understand shoppers, identify opportunities, and
              improve product discovery.
            </p>
          </Reveal>

          {/* Figma leaves a grey rectangle here. The section is addressed to
              the merchant rather than the shopper — what the queries tell you
              — so the slot holds the analytics panel rather than a fifth
              storefront screenshot. The numbers in it are sample data. */}
          <Reveal className="relative mt-10 lg:row-span-2 lg:mt-0" delay={90}>
            <Image
              src="/img/pages/search-insights-panel.svg"
              alt="A search analytics panel: total searches, zero-result searches and new terms, over a list of the store’s top queries"
              width={720}
              height={560}
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="w-full drop-shadow-[0_24px_50px_rgba(96,44,14,0.16)]"
            />
          </Reveal>

          <Reveal className="relative mt-8 lg:mt-10" delay={140}>
            <StepCard card={CARDS[0]} />
          </Reveal>
        </div>

        {/* The other two steps, offset right then left the way Figma stacks
            them, with the route running between. */}
        <Reveal className="relative mt-8 lg:mt-14 lg:w-[54%] lg:ml-auto" delay={80}>
          <StepCard card={CARDS[1]} />
        </Reveal>

        <Reveal className="relative mt-8 lg:mt-14 lg:w-[54%]" delay={160}>
          <StepCard card={CARDS[2]} />
        </Reveal>

        {/* The mark Figma parks on the last bend of the route. */}
        <span
          aria-hidden
          className="absolute right-[18%] -bottom-1 hidden size-14 place-items-center rounded-full bg-white text-brand shadow-[0_14px_30px_-16px_rgba(96,44,14,0.6)] ring-1 ring-peach lg:grid"
        >
          <Sparkle className="size-6" />
        </span>
      </div>
    </section>
  );
}
