/* Illustrative, not a screenshot: shaped like the search-insights view but
   carrying made-up queries, so nothing here should be read as a real store's
   numbers. The bar heights and fill widths are the only figures in it and they
   exist to give the shape a slope. */
const BARS = [22, 34, 46, 58, 72, 96];

const QUERIES = [
  { term: "sunscreen", fill: 88 },
  { term: "travel bag", fill: 64 },
  { term: "gifts for mom", fill: 47 },
  { term: "running shoes", fill: 35 },
  { term: "skincare under $10", fill: 24 },
];

/**
 * The analytics half of the pitch, drawn rather than photographed. The row it
 * illustrates is about the store learning what shoppers ask for, so the queries
 * are the subject and the chart is the backdrop — hence the list carrying real
 * type and the bars carrying none.
 */
export default function InsightsPanel() {
  return (
    <div className="relative w-full max-w-[440px]">
      <div /* The extra floor is where the "Spot opportunities" chip lands — without
           it the chip sits over the last query row and hides half of it. */
        className="rounded-[18px] bg-white p-5 pb-10 shadow-[0_26px_60px_-32px_rgba(23,23,23,0.55)] ring-1 ring-brand/12 sm:p-6 sm:pb-11">
        <p className="font-poppins text-[16px] font-extrabold text-charcoal sm:text-[18px]">
          Search insights
        </p>

        <div
          aria-hidden
          className="mt-5 flex h-[96px] items-end gap-2 sm:h-[112px] sm:gap-2.5"
        >
          {BARS.map((height, i) => (
            <span
              key={height}
              className="flex-1 rounded-t-[5px] bg-brand"
              style={{ height: `${height}%`, opacity: 0.45 + i * 0.11 }}
            />
          ))}
        </div>

        <ul className="mt-5 space-y-2.5">
          {QUERIES.map((query) => (
            <li key={query.term} className="flex items-center gap-3">
              <MagnifierIcon />
              <span className="min-w-0 flex-1 truncate text-[13px] text-body-mute sm:text-[14px]">
                {query.term}
              </span>
              <span
                aria-hidden
                className="h-[7px] w-[86px] shrink-0 overflow-hidden rounded-full bg-peach sm:w-[104px]"
              >
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${query.fill}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* The two chips are the point the panel is making, so they sit proud of
          it rather than inside — same trick the storefront mocks use. */}
      <span className="absolute -top-4 right-2 flex items-center gap-2 rounded-[11px] bg-white px-3 py-2 shadow-[0_12px_28px_-16px_rgba(23,23,23,0.55)] ring-1 ring-brand/15 sm:-right-6">
        <TrendIcon />
        <span className="leading-tight">
          <span className="block font-poppins text-[13px] font-extrabold text-charcoal">
            Trending
          </span>
          <span className="block text-[11px] text-body-mute">searches</span>
        </span>
      </span>

      <span /* Held inside the wrapper until sm: on a phone this box is the full
            column, so a chip hanging off its right edge hangs off the page. */
        className="absolute right-1 -bottom-5 flex items-center gap-2 rounded-[11px] bg-white px-3 py-2 shadow-[0_12px_28px_-16px_rgba(23,23,23,0.55)] ring-1 ring-brand/15 sm:-right-8">
        <BulbIcon />
        <span className="leading-tight">
          <span className="block font-poppins text-[13px] font-extrabold text-charcoal">
            Spot
          </span>
          <span className="block text-[11px] text-body-mute">opportunities</span>
        </span>
      </span>
    </div>
  );
}

function MagnifierIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-muted"
    >
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="m15.5 15.5 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-brand">
      <path
        d="M3 17 9.5 10.5l3.5 3.5L21 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 6h6v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-brand">
      <path
        d="M9 17.5a6 6 0 1 1 6 0v1.2a1.3 1.3 0 0 1-1.3 1.3h-3.4A1.3 1.3 0 0 1 9 18.7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
