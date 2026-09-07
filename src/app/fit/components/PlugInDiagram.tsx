import Image from "next/image";

const OUTCOMES = [
  { title: "Better", detail: "product discovery" },
  { title: "Happier", detail: "shoppers" },
  { title: "More", detail: "conversions" },
];

/**
 * "Install, then this happens." The Figma draws it as a wiring diagram —
 * storefront, app, three outcomes — which is the whole argument for the row it
 * sits in: nothing about the store changes on the left of the arrow.
 *
 * Built in markup rather than exported flat so the two logos stay crisp and
 * the outcome labels stay text. The connectors are the one part that has to be
 * drawn, and they are decorative — the reading order already says which way
 * the arrow points.
 *
 * Laid out end to end it measures about 355px, which is wider than a phone
 * column, so below sm the run turns the corner and the outcomes stack under
 * the two tiles instead.
 */
export default function PlugInDiagram() {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <Tile>
          <Image
            src="/img/logos/logo-shopify.svg"
            alt="Shopify"
            width={261}
            height={75}
            className="h-auto w-[62px] sm:w-[76px]"
          />
        </Tile>
        <span aria-hidden className="h-0.5 w-4 shrink-0 rounded-full bg-brand/35 sm:w-7" />
        <Tile>
          <Image
            src="/brand/logo.svg"
            alt="Growmerce"
            width={310}
            height={67}
            className="h-auto w-[64px] sm:w-[78px]"
          />
        </Tile>
      </div>

      {/* Stacked, the run simply turns down. */}
      <span aria-hidden className="h-5 w-0.5 rounded-full bg-brand/35 sm:hidden" />

      {/* Side by side, it fans out. The bracket is a border on a box the chips
          sit beside, which keeps the three arms in step with the column's own
          height instead of needing a fixed one; the stub in front closes the
          gap to the tile so the two halves read as one run of wire. */}
      <span aria-hidden className="hidden h-0.5 w-7 shrink-0 rounded-full bg-brand/35 sm:block" />
      <div
        aria-hidden
        className="hidden h-[150px] w-6 shrink-0 rounded-l-[10px] border-y-2 border-l-2 border-dashed border-brand/35 sm:-ml-5 sm:block"
      />

      <ul className="flex flex-col gap-2.5 sm:gap-4">
        {OUTCOMES.map((outcome) => (
          <li
            key={outcome.title}
            className="rounded-[12px] bg-white px-3 py-2 shadow-[0_10px_26px_-18px_rgba(23,23,23,0.5)] ring-1 ring-brand/15 sm:px-4 sm:py-2.5"
          >
            <p className="font-poppins text-[14px] leading-none font-extrabold text-charcoal sm:text-[17px]">
              {outcome.title}
            </p>
            <p className="mt-1 text-[11px] leading-none text-body-mute sm:text-[13px]">
              {outcome.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid size-[86px] shrink-0 place-items-center rounded-[16px] bg-white px-2.5 shadow-[0_14px_34px_-20px_rgba(23,23,23,0.55)] ring-1 ring-brand/12 sm:size-[104px]">
      {children}
    </div>
  );
}
