import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import type { FeatureRowData } from "../rows-data";

function SlidersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
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
  if (row.mediaSrc) {
    return (
      <Image
        src={row.mediaSrc}
        alt={`${row.title} product demonstration`}
        fill
        unoptimized
        sizes="(min-width: 1024px) 42vw, 92vw"
        className="object-cover"
      />
    );
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
          GIF demo placeholder
        </span>
      </div>
    </div>
  );
}

function FeatureReelCard({ row, delay }: { row: FeatureRowData; delay: number }) {
  return (
    <Reveal delay={delay}>
      <article className="group relative aspect-[9/14] w-full overflow-hidden rounded-[34px] border-2 border-brand bg-peach p-5 shadow-[0_24px_60px_-36px_rgba(255,90,31,0.8)] transition-transform duration-300 hover:-translate-y-1 sm:p-7">
        <div className="relative h-full w-full overflow-hidden rounded-[26px] border-2 border-brand bg-white">
          <ReelMedia row={row} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent px-5 pb-5 pt-28 sm:px-7 sm:pb-7 sm:pt-36">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/75 bg-peach/80 px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-brand uppercase backdrop-blur-sm sm:text-xs">
              <SlidersIcon />
              {row.eyebrow}
            </p>
            <h3 className="mt-3 max-w-[18ch] text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.05] font-bold text-charcoal">
              {row.title}
            </h3>
            <span className="mt-3 block h-1 w-14 bg-brand" />
            <ul className="mt-3 space-y-1.5 text-[13px] leading-[1.3] text-body-mute sm:text-[14px]">
              {row.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
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
