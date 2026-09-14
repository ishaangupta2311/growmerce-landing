import Image from "next/image";
import Reveal from "./Reveal";

type GlyphProps = { className?: string };

/* Outline glyphs in the same hand as the audience and growth cards further
   down the page, so the three card rows read as one set. The Figma marks
   were filled icons at three different sizes, one with its own disc baked
   into the file. */
function SearchGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="10.5" cy="10.5" r="6.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15.4 15.4 5.2 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function NodesGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v3.3M12 10.8l-5 5.5M12 10.8l5 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M14.5 11.5H20v4h-5.5a2 2 0 0 1 0-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M6.5 6V5a1.5 1.5 0 0 1 1.5-1.5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const CARDS = [
  {
    icon: SearchGlyph,
    title: "The search box lies to you",
    body: "Native search matches keywords, not intent. A shopper searching \"gift for my mom\" gets nothing, even if you sell exactly that. Every missed match is revenue you already paid to acquire.",
  },
  {
    icon: NodesGlyph,
    title: "\"AI-powered\" usually means a login screen",
    body: "Most tools promise natural language search and ship a dashboard nobody opens. Almost none connect what shoppers are typing to how your store actually performs.",
  },
  {
    icon: WalletGlyph,
    title: "You're expected to do more with less",
    body: "Same team, same budget, this quarter, not \"next release.\" Growsearch has to prove itself in your numbers, not a case study from someone else's store.",
  },
];

export default function Fighting() {
  return (
    <section id="about" className="mx-auto max-w-[1370px] px-6 pt-24">
      <Reveal>
        <p className="section-eyebrow">The problem</p>
        <h2 className="section-title mt-4">
          What is <span className="text-brand">Growmerce fighting?</span>
        </h2>
        <p className="section-lede mt-5 max-w-[66ch]">
          Nearly a third of ecommerce searches end in nothing: the shopper types, gets zero useful results, and leaves. Growmerce isn&apos;t fighting one product. It&apos;s fighting that default: hiring more, buying more disconnected tools, or waiting for traffic to convert on its own.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {CARDS.map((card, i) => {
          const Glyph = card.icon;
          return (
            <Reveal key={card.title} delay={i * 110}>
              <article className="section-card h-full">
                <span className="grid size-11 place-items-center rounded-[10px] bg-peach/70 text-brand">
                  <Glyph className="size-6" />
                </span>
                <h3 className="mt-5 text-[21px] leading-[1.25]">{card.title}</h3>
                <p className="mt-3 text-[15.5px] leading-[1.55] text-body-mute">{card.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* Closing line on the three cards — a step below them in scale, so it
          reads as the section's last word rather than a fourth card. */}
      <Reveal delay={100}>
        <div className="mt-5 flex flex-col items-start gap-4 rounded-[20px] border border-peach bg-cream px-6 py-5 sm:flex-row sm:items-center sm:gap-5">
          <Image
            src="/img/icon-growth-circle.svg"
            alt=""
            width={154}
            height={150}
            className="size-11 shrink-0"
          />
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] text-charcoal/55 uppercase">
              Growmerce doesn&apos;t sell a platform
            </p>
            <p className="mt-1 text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-snug font-semibold">
              It sells proof — shipped into your workflow,{" "}
              <span className="text-brand">this week.</span>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
