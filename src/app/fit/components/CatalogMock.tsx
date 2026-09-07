import Image from "next/image";
import { Burst, Sparkle } from "@/components/site/Marks";

/* The six that fill the grid behind the panel, and the three the search
   returns. Cut out of the Figma slide — the photography is the one part of
   that artwork worth keeping, since the type baked in beside it reads
   "Corry-on Suitcase" and "Acj to cart". */
const GRID = [
  { src: "shoe", alt: "Running shoe" },
  { src: "bag", alt: "Leather tote" },
  { src: "headphones", alt: "Over-ear headphones" },
  { src: "cap", alt: "Green cap" },
  { src: "candle", alt: "Poured candle" },
  { src: "sunglasses", alt: "Sunglasses" },
];

const RESULTS = [
  { src: "suitcase", title: "Carry-on Suitcase" },
  { src: "pouch", title: "Travel Pouch" },
  { src: "bottle", title: "Water Bottle" },
];

/**
 * Row 01's picture: a catalogue big enough to get lost in, with the results
 * for one query laid over it.
 *
 * The Figma draws this as a flat slide export whose every label is misspelled,
 * so the composition is rebuilt here and only the product photography is
 * carried over. Everything with a word in it is real text — which also means
 * it scales, reflows and can be read out.
 */
export default function CatalogMock() {
  return (
    <div className="relative mx-auto w-full max-w-[600px]" aria-hidden>
      {/* Six tiles on the left, the answer to one query raised over their
          right edge — the arrangement the Figma draws, where the grid stays
          readable rather than being buried under the panel. */}
      <div className="mt-[9%] w-[55%] rounded-[18px] bg-white p-2.5 shadow-[0_18px_44px_-26px_rgba(23,23,23,0.45)] sm:p-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {GRID.map((item) => (
            <Image
              key={item.src}
              src={`/img/fit/${item.src}.webp`}
              alt=""
              width={140}
              height={151}
              sizes="(min-width: 1024px) 96px, 20vw"
              className="h-auto w-full rounded-[10px] bg-[#f4f4f4]"
            />
          ))}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[48%] rounded-[18px] bg-white p-3 shadow-[0_26px_60px_-28px_rgba(23,23,23,0.5)] sm:p-4">
        {/* Search field */}
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" className="size-[13px] shrink-0 text-charcoal sm:size-4">
            <circle cx="10.5" cy="10.5" r="6.7" stroke="currentColor" strokeWidth="2.2" />
            <path d="m15.4 15.4 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="min-w-0 flex-1 truncate font-poppins text-[11px] font-bold text-charcoal sm:text-[13px]">
            travel essentials
          </span>
          <Sparkle className="size-3 shrink-0 text-brand sm:size-3.5" />
        </div>

        <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
          {RESULTS.map((result) => (
            <li key={result.src} className="flex items-center gap-2.5 sm:gap-3">
              <Image
                src={`/img/fit/${result.src}.webp`}
                alt=""
                width={128}
                height={128}
                sizes="(min-width: 1024px) 58px, 13vw"
                className="h-auto w-[27%] shrink-0 rounded-[8px] bg-[#f4f4f4]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10.5px] leading-tight font-semibold text-charcoal sm:text-[12px]">
                  {result.title}
                </span>
                <Stars />
                <span className="mt-1.5 block w-full rounded-[5px] bg-coral/45 py-[3px] text-center text-[9px] font-bold text-white sm:text-[10.5px]">
                  Add to cart
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Burst className="absolute -top-[5%] right-[2%] size-5 text-brand sm:size-7" />
      <Burst className="absolute top-[4%] right-[47%] size-4 -scale-x-100 text-brand sm:size-5" />
    </div>
  );
}

function Stars() {
  return (
    <span className="mt-0.5 flex gap-[2px]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-[8px] fill-brand sm:size-[9px]">
          <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}
