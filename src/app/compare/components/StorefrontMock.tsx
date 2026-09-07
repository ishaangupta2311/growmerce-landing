import Image from "next/image";
import { Sparkle } from "@/components/site/Marks";

/* The four the search returns. Photography lifted from the Figma; the labels
   and prices beside it are markup, so they stay text. */
const RESULTS = [
  { src: "dress-linen", name: "Linen Maxi Dress", price: "$89.00" },
  { src: "dress-floral", name: "Floral Midi Dress", price: "$76.00" },
  { src: "dress-wrap", name: "Cotton Wrap Dress", price: "$92.00" },
  { src: "dress-satin", name: "Satin Slip Dress", price: "$68.00" },
];

/**
 * The storefront the hero is arguing about: one sentence in the bar, four real
 * products out, buyable from the results.
 *
 * The Figma stages this inside a rendered laptop on a podium. That scene is a
 * bitmap with the whole interface — search field, product names, prices —
 * painted into it, so it cannot be read, selected, or reflowed onto a phone.
 * The interface is rebuilt here and the laptop dropped: it was set dressing,
 * and the site does not use device frames anywhere else.
 */
export default function StorefrontMock() {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_30px_70px_-30px_rgba(23,23,23,0.45)] ring-1 ring-brand/12">
      {/* Chrome */}
      <div className="flex items-center justify-between gap-4 border-b border-line/70 px-4 py-3 sm:px-5">
        <span className="flex items-center gap-2">
          <Image
            src="/brand/logo.svg"
            alt="Growmerce"
            width={310}
            height={67}
            className="h-auto w-[104px] sm:w-[122px]"
          />
        </span>
        <span aria-hidden className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[7px] rounded-full bg-peach" />
          ))}
        </span>
      </div>

      <div className="px-4 pt-4 pb-5 sm:px-5 sm:pt-5 sm:pb-6">
        {/* The query. A sentence with a budget in it — the thing a keyword
            index cannot do anything with. */}
        {/* min-w-0 + overflow-hidden: the query is `truncate`, and without a
            shrinkable row the untruncated string sets the mock's minimum width
            and, through it, the page's minimum layout width. */}
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden rounded-full bg-cream px-3.5 py-2.5 ring-1 ring-line sm:gap-3 sm:px-4 sm:py-3">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4 shrink-0 text-charcoal/70 sm:size-[18px]">
            <circle cx="10.5" cy="10.5" r="6.7" stroke="currentColor" strokeWidth="2.2" />
            <path d="m15.4 15.4 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="min-w-0 flex-1 truncate text-[13px] text-charcoal sm:text-[15px]">
            summer dresses under $100
          </span>
          <Sparkle className="size-3.5 shrink-0 text-brand sm:size-4" />
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-white sm:size-8"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-[15px] sm:size-4">
              <circle cx="10.5" cy="10.5" r="6.7" stroke="currentColor" strokeWidth="2.4" />
              <path d="m15.4 15.4 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {RESULTS.map((item) => (
            <li key={item.src} className="min-w-0">
              <Image
                src={`/img/compare/${item.src}.webp`}
                alt=""
                width={130}
                height={151}
                sizes="(min-width: 1024px) 120px, 22vw"
                className="h-auto w-full rounded-[8px] bg-[#f0f0f0]"
              />
              <p className="mt-2 truncate text-[10px] leading-tight font-medium text-charcoal sm:text-[12px]">
                {item.name}
              </p>
              <p className="text-[10px] leading-tight text-body-mute sm:text-[12px]">
                {item.price}
              </p>
              <p className="mt-1.5 rounded-[5px] border border-brand py-[3px] text-center text-[9px] font-bold text-brand sm:text-[10.5px]">
                Add to cart
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
