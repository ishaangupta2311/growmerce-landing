import Reveal from "@/components/site/Reveal";
import type { FeatureRowData } from "../rows-data";
import ReelVideo from "./ReelVideo";

function SlidersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[1.35em] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 6h6m4 0h6M4 12h2m4 0h10M4 18h8m4 0h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="6" r="2" fill="currentColor" />
      <circle cx="8" cy="12" r="2" fill="currentColor" />
      <circle cx="14" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function ReelMedia({ row }: { row: FeatureRowData }) {
  if (row.videoSrc) {
    return <ReelVideo src={row.videoSrc} title={row.title} />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-center text-muted">
        <span className="flex size-14 items-center justify-center rounded-full border border-brand/30 bg-peach/50 text-brand">
          <svg
            aria-hidden="true"
            className="ml-1 size-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="m8 5 11 7-11 7V5Z" />
          </svg>
        </span>
        <span className="px-5 text-[11px] font-bold tracking-[0.18em] uppercase">
          Demo placeholder
        </span>
      </div>
    </div>
  );
}

/* The eyebrow now sits above the card, so the height budget has to pay for it
   as well as the gap beneath it. */
const EYEBROW_H = "2.75rem";

/* How tall a card is allowed to be: the viewport less the sticky header, the
   eyebrow above it and a margin, so one card is always visible whole. Two
   columns of the 1200px container make a 9/14 card ~859px tall, which
   overflows every laptop. */
const MAX_H = `calc(100svh - 9rem - ${EYEBROW_H})`;

function FeatureReelCard({ row, delay }: { row: FeatureRowData; delay: number }) {
  return (
    <Reveal delay={delay}>
      {/* Height is capped against the viewport and the width against 3/4 of
          that cap, which keeps the card portrait however short the window
          gets — a cap on height alone lets it go landscape, and the clip and
          the caption both stop working at that shape. With room to spare
          neither bound bites and the card keeps its natural 9/14. The width
          lives here rather than on the card so the eyebrow lines up with the
          card's left edge instead of the column's. */}
      <div
        className="mx-auto flex flex-col gap-3"
        style={{ width: `min(100%, calc(${MAX_H} * 3 / 4))` }}
      >
        {/* Outside the card on purpose. Over the clip this was one more thing
            covering a demo that is already short of room. */}
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/75 bg-peach px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-brand uppercase sm:text-xs">
          <SlidersIcon />
          {row.eyebrow}
        </p>
        <article
          className="content-auto group relative aspect-[9/14] w-full rounded-[34px] border-2 border-brand bg-peach p-5 shadow-[0_24px_60px_-36px_rgba(255,90,31,0.8)] transition-transform duration-300 hover-lift [--lift:4px] sm:p-7"
          style={{ maxHeight: MAX_H }}
        >
          <div className="@container relative h-full w-full overflow-hidden rounded-[26px] border-2 border-brand bg-white">
            <ReelMedia row={row} />
            {/* Sized in cqw against the well rather than the viewport, so the
                caption stays the same fraction of the card at every size — in
                px it keeps its height as the card shrinks and swallows the
                clip. The wash only has to carry the text, not hide what is
                behind it: transparent well above the title, and not fully
                opaque until it reaches the bullets. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-[5.7cqw] pt-[19cqw] pb-[5.7cqw]">
              <h3 className="max-w-[18ch] text-[clamp(1rem,5.3cqw,1.75rem)] leading-[1.05] font-bold text-charcoal">
                {row.title}
              </h3>
              <span className="mt-[2cqw] block h-[0.8cqw] w-[9.8cqw] bg-brand" />
              <ul className="mt-[2cqw] space-y-[1.2cqw] text-[clamp(0.6875rem,2.65cqw,0.85rem)] leading-[1.35] text-body-mute">
                {row.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-[1.6cqw]">
                    <span aria-hidden="true">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>
    </Reveal>
  );
}

export default function FeatureReelGrid({ rows }: { rows: FeatureRowData[] }) {
  const left = rows.filter((_, index) => index % 2 === 0);
  const right = rows.filter((_, index) => index % 2 === 1);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-8 lg:space-y-12">
        {left.map((row, index) => (
          <FeatureReelCard key={row.title} row={row} delay={index * 70} />
        ))}
      </div>
      <div className="space-y-8 lg:space-y-12 lg:pt-28">
        {right.map((row, index) => (
          <FeatureReelCard key={row.title} row={row} delay={index * 70 + 120} />
        ))}
      </div>
    </div>
  );
}
