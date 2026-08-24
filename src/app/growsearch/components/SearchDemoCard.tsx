import Image from "next/image";

/* Inline magnifying-glass glyph, matching the hand-drawn style of the other
   shared icon components (Arrow, the Growsearch CircleTick) rather than
   pulling in a new asset. */
function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-3.8-3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The Figma "search demo card": a peach results panel, a decorative-but-
 * accessible search field, a "No Dead ends" badge, a "Search → Checkout"
 * chip, and a handwritten-style annotation. Built in markup/CSS per the
 * brief rather than shipped as a single flattened image.
 */
export default function SearchDemoCard() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <span
        className="absolute -top-4 left-4 z-10 -rotate-6 rounded-full bg-[#FFD23F] px-4 py-1.5 font-poppins text-[13px] font-bold text-charcoal shadow-[0_10px_24px_-8px_rgba(23,23,23,0.35)] sm:-left-5"
        aria-hidden
      >
        No Dead ends
      </span>

      <div className="rounded-[32px] border border-line bg-white p-5 shadow-glow-lg sm:p-7">
        <div className="flex items-center justify-between">
          <span className="font-poppins text-[12px] font-bold tracking-[0.22em] text-muted uppercase">
            Growsearch
          </span>
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-line" />
            <span className="size-2 rounded-full bg-line" />
            <span className="size-2 rounded-full bg-brand" />
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[20px] bg-peach">
          <Image
            src="/img/smart-search-mock.png"
            alt="Growsearch results panel showing skincare products matched to the query, with prices and an add-to-cart action"
            width={1536}
            height={1024}
            className="h-[210px] w-full object-cover object-top sm:h-[250px]"
          />
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-full border border-line bg-white py-2 pr-2 pl-4 transition-colors focus-within:border-brand">
          <SearchGlyph className="shrink-0 text-muted" />
          <label htmlFor="growsearch-demo-query" className="sr-only">
            Example Growsearch query
          </label>
          <input
            id="growsearch-demo-query"
            type="text"
            readOnly
            value="Skincare under $20"
            aria-describedby="growsearch-demo-note"
            className="flex-1 bg-transparent font-medium text-charcoal outline-none"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 font-poppins text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>

        <p
          id="growsearch-demo-note"
          className="mt-4 -rotate-2 text-center font-poppins text-[13px] text-muted italic"
        >
          matched on meaning, not spelling
        </p>
      </div>

      <span className="absolute right-2 -bottom-4 z-10 max-w-[calc(100%-1rem)] rounded-full bg-charcoal px-4 py-2 font-poppins text-[12px] font-semibold whitespace-nowrap text-white shadow-[0_10px_24px_-8px_rgba(23,23,23,0.5)] sm:right-3 sm:text-[13px] lg:-right-4">
        Search → Checkout
      </span>
    </div>
  );
}
