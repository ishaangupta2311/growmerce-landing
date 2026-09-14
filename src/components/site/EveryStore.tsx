import Image from "next/image";
import Reveal from "./Reveal";

/* The six segment marks. Figma draws them as filled glyphs inside a peach
   tile; they are outline strokes here so one set of paths carries every
   weight the tile is asked to render at. All decorative — the card's own
   heading names the segment. */
type GlyphProps = { className?: string };

function Storefront({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 9.5h17V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.5 4.7 4.4A1 1 0 0 1 5.65 3.7h12.7a1 1 0 0 1 .95.7L21 9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 21v-5.2h6V21" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function Trolley({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M2.5 3.5h2.3l2.5 10.6a1.4 1.4 0 0 0 1.36 1.07h8.1a1.4 1.4 0 0 0 1.36-1.05L21.5 7H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="19.5" r="1.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function Bag({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M4.7 7.5h14.6l1.1 12.1a1.3 1.3 0 0 1-1.3 1.4H4.9a1.3 1.3 0 0 1-1.3-1.4L4.7 7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 10V6.9a3.4 3.4 0 0 1 6.8 0V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Warehouse({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 21V6.2l6.4-2.7v17.5M9.9 21V9.4l10.6-2.6V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.3 11.6v2.2M17.1 10.9v2.2M13.3 16.1v2.2M17.1 15.6v2.2M6.1 9.6v2.2M6.1 14.4v2.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M2.4 21h19.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Globe({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="8.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.3 12h17.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M12 3.3c2.3 2.4 3.5 5.4 3.5 8.7s-1.2 6.3-3.5 8.7c-2.3-2.4-3.5-5.4-3.5-8.7S9.7 5.7 12 3.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Gem({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M7.4 3.5h9.2l4 5.3L12 20.6 3.4 8.8l4-5.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3.4 8.8h17.2M9.2 8.8 12 20.6l2.8-11.8-2.1-5.3h-1.4L9.2 8.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* The card bodies are ours: Figma leaves the six tiles empty below the
   heading, and a segment name on its own tells a reader nothing about
   whether they are the segment. Each one names the search problem that
   size of catalogue actually has. */
const SEGMENTS = [
  {
    icon: Storefront,
    title: "Startups & D2C Brands",
    body: "You have one product line and no search team. Install Growsearch, and your store answers questions properly from day one instead of waiting until there's budget for it.",
  },
  {
    icon: Trolley,
    title: "Growing Marketplaces",
    body: "Every seller on your platform names things their own way. Growsearch reads what the shopper meant, not what the listing says, so even a scrappy or inconsistent catalog still returns the right shelf.",
  },
  {
    icon: Bag,
    title: "Mid-sized Stores",
    body: "Traffic is fine, but search converts badly, and nobody can say why. The analytics show exactly which queries lose the sale, so you fix the ones costing you money first.",
  },
  {
    icon: Warehouse,
    title: "Large Catalog Businesses",
    body: "You have thousands of SKUs, and the long tail is where the misses hide. Semantic matching keeps deep inventory reachable without you hand-tuning synonyms for every edge case.",
  },
  {
    icon: Globe,
    title: "Growth-Stage Retailers",
    body: "Your merchandising team writes product titles one way; your customers search a completely different way. Growsearch closes that gap by matching what shoppers mean, not the exact words your team chose.",
  },
  {
    icon: Gem,
    title: "Niche & Specialty Stores",
    body: "Your customers use vocabulary a keyword index has never seen. Intent matching handles the jargon, and zero-result recovery covers whatever's left.",
  },
];

/* Decoration for the header: one storefront that fits any catalogue, three
   chips for what the search is being asked about, and the dotted route
   between them. Percentages of a square stage rather than fixed pixels, so
   the whole arrangement scales with the column instead of drifting out of it.

   The mark is its own drawing rather than the hero's trolley: that trolley is
   already the first thing on this page, and meeting it again five sections
   down read as one photograph doing two jobs. */
function SegmentArt() {
  const chips = [
    { left: "22%", top: "17%", label: "chart" },
    { left: "47%", top: "3%", label: "globe" },
    { left: "68%", top: "28%", label: "tag" },
  ];

  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[300px]">
      <div className="absolute top-[5%] left-[10%] size-[84%] rounded-full bg-peach/70" />

      {/* The route between the chips. Drawn under them so the dots run to the
          tile edges rather than across their faces. */}
      <svg viewBox="0 0 100 100" fill="none" className="absolute inset-0 size-full">
        <path
          d="M34 24 Q44 14 54 12"
          stroke="var(--color-brand)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="0.5 4"
          opacity="0.55"
        />
        <path
          d="M62 22 Q74 26 76 35"
          stroke="var(--color-brand)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="0.5 4"
          opacity="0.55"
        />
      </svg>

      <Image
        src="/img/pages/every-store-mark.svg"
        alt=""
        width={360}
        height={360}
        sizes="300px"
        className="absolute top-[28%] left-[8%] w-[56%]"
      />

      {chips.map((chip) => (
        <div
          key={chip.label}
          className="absolute grid size-[21%] place-items-center rounded-[26%] bg-white text-brand shadow-[0_8px_18px_-10px_rgba(96,44,14,0.55)] ring-1 ring-peach"
          style={{ left: chip.left, top: chip.top }}
        >
          {chip.label === "chart" ? (
            <svg viewBox="0 0 24 24" fill="none" className="size-[52%]">
              <path
                d="M5 20V11M12 20V4M19 20v-6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          ) : chip.label === "globe" ? (
            <Globe className="size-[52%]" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="size-[52%]">
              <path
                d="M12.6 3.4H20a.6.6 0 0 1 .6.6v7.4a1 1 0 0 1-.3.7l-8.5 8.5a1 1 0 0 1-1.4 0l-7.1-7.1a1 1 0 0 1 0-1.4l8.5-8.5a1 1 0 0 1 .8-.2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="16.6" cy="7.4" r="1.5" fill="currentColor" />
            </svg>
          )}
        </div>
      ))}

      {/* The little strokes Figma scatters around the mark. */}
      <svg viewBox="0 0 100 100" fill="none" className="absolute inset-0 size-full text-brand">
        <path
          d="M90 22v4M88 24h4M14 46v3M12.5 47.5h3M92 62v3.4M90.3 63.7h3.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

export default function EveryStore() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-24">
      {/* The header and its mark share a row on a desk. On a phone the mark
          goes first: a 300px illustration between the heading and the cards
          pushes the six tiles a screen further down for no gain. */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-center lg:gap-12">
        <Reveal className="order-2 lg:order-1">
          <p className="inline-block rounded-[7px] bg-peach px-3.5 py-2 font-poppins text-[13px] font-extrabold tracking-[0.02em] text-brand uppercase">
            Perfect for every ecommerce business
          </p>
          <h2 className="mt-5 max-w-[760px] text-[clamp(2rem,4.2vw,3.35rem)] leading-[1.08] font-bold">
            Wherever Your Search Is Losing Sales,{" "}
            <span className="text-brand-bright">We Start There</span>
          </h2>
          <p className="mt-5 max-w-[700px] text-[17px] leading-[1.6] text-body-mute">
            Whether you&apos;re a startup or an enterprise, Growsearch adapts to
            your catalog size, your customer behavior, and where your business
            is headed next.
          </p>
        </Reveal>

        <Reveal className="order-1 mb-8 lg:order-2 lg:mb-0" delay={80}>
          <SegmentArt />
        </Reveal>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
        {SEGMENTS.map((segment, i) => {
          const Glyph = segment.icon;
          return (
            <Reveal key={segment.title} delay={(i % 3) * 110}>
              <article className="h-full rounded-[14px] border border-peach bg-white p-5 transition-[transform,box-shadow] duration-300 hover-lift [--lift:4px] hover:shadow-glow">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-peach/70 text-brand">
                    <Glyph className="size-6" />
                  </span>
                  <h3 className="text-[19px] leading-[1.25] font-bold">
                    {segment.title}
                  </h3>
                </div>
                <p className="mt-4 text-[15.5px] leading-[1.55] text-body-mute">
                  {segment.body}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>

    </section>
  );
}
