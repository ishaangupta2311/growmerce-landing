import Image from "next/image";
import { Burst, Sparkle } from "@/components/site/Marks";

const PICKS = [
  { src: "mug", alt: "Stoneware mug" },
  { src: "press", alt: "French press" },
  { src: "beans", alt: "Bag of coffee beans" },
];

/**
 * Row 02's picture: a sentence going into the search bar and the right shelf
 * coming out, with the claim in between.
 *
 * Rebuilt from the Figma rather than exported, for the same reason as
 * CatalogMock — and because the query is the point of the picture, so it
 * should be text a reader can select rather than pixels.
 */
export default function IntentMock() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] py-2" aria-hidden>
      {/* The trail the Figma runs from the query round to the results. It is
          drawn without preserveAspectRatio so it stretches with the block
          rather than needing a height that tracks the content. */}
      <svg
        viewBox="0 0 100 200"
        fill="none"
        preserveAspectRatio="none"
        className="absolute top-[14%] left-0 h-[72%] w-[22%] text-brand/50"
      >
        <path
          d="M96 6C48 6 6 34 6 100s42 94 90 94"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="13 15"
        />
      </svg>

      <div className="relative ml-[9%]">
        {/* The query */}
        <div className="flex w-[86%] items-center gap-3 rounded-full bg-white px-4 py-3 shadow-[0_18px_44px_-24px_rgba(23,23,23,0.5)] sm:px-6 sm:py-4">
          <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 text-charcoal sm:size-[18px]">
            <circle cx="10.5" cy="10.5" r="6.7" stroke="currentColor" strokeWidth="2.4" />
            <path d="m15.4 15.4 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span className="min-w-0 flex-1 truncate font-poppins text-[13px] font-bold text-charcoal sm:text-[16px]">
            gifts for coffee lovers
          </span>
          <Sparkle className="size-4 shrink-0 text-brand sm:size-5" />
        </div>

        {/* The claim, in the gap and hanging off to the right of both cards —
            it belongs to neither, which is how the Figma places it. */}
        <div className="relative z-10 mt-3 -mr-[9%] ml-auto flex w-fit items-center gap-2 rounded-[10px] bg-white px-3 py-2 shadow-[0_14px_34px_-20px_rgba(23,23,23,0.5)] sm:gap-3 sm:px-4">
          <Sparkle className="size-5 shrink-0 text-brand sm:size-6" />
          <span className="leading-tight">
            <span className="block font-poppins text-[12px] font-extrabold text-charcoal sm:text-[15px]">
              Understands
            </span>
            <span className="block text-[11px] text-body-mute sm:text-[13px]">
              customer intent
            </span>
          </span>
        </div>

        {/* The shelf it lands on */}
        <div className="mt-3 w-[78%] rounded-[18px] bg-white p-2.5 shadow-[0_20px_50px_-26px_rgba(23,23,23,0.45)] sm:p-3.5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {PICKS.map((pick) => (
              <Image
                key={pick.src}
                src={`/img/fit/${pick.src}.webp`}
                alt=""
                width={186}
                height={197}
                sizes="(min-width: 1024px) 118px, 24vw"
                className="h-auto w-full rounded-[10px] bg-[#f4f4f4]"
              />
            ))}
          </div>
        </div>
      </div>

      <Burst className="absolute top-[6%] right-[6%] size-5 -scale-x-100 text-brand sm:size-7" />
      <Burst className="absolute top-[2%] left-[6%] size-4 text-brand sm:size-5" />
    </div>
  );
}
