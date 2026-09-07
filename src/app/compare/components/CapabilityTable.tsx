type Mark = "yes" | "part" | "no";

/* Columns are categories, not products. Naming vendors would mean publishing
   claims about their roadmaps that we cannot check and they would be right to
   argue with; the categories are stable and every merchant can place their own
   stack in one of them. */
const COLUMNS = [
  { key: "native", label: "Native store search" },
  { key: "recs", label: "Recommendation apps" },
  { key: "plugins", label: "General AI plugins" },
  { key: "growmerce", label: "Growmerce" },
] as const;

type Row = {
  capability: string;
  detail: string;
  marks: Record<(typeof COLUMNS)[number]["key"], Mark>;
};

const ROWS: Row[] = [
  {
    capability: "Reads a sentence, not keywords",
    detail: "“something warm for a rainy commute”, not warm + commute",
    marks: { native: "no", recs: "no", plugins: "yes", growmerce: "yes" },
  },
  {
    capability: "Recovers a search that finds nothing",
    detail: "Offers the nearest real shelf instead of an empty page",
    marks: { native: "no", recs: "part", plugins: "part", growmerce: "yes" },
  },
  {
    capability: "Lets the shopper keep talking",
    detail: "“only under $20”, “actually, show me sunscreens”",
    marks: { native: "no", recs: "no", plugins: "yes", growmerce: "yes" },
  },
  {
    capability: "Sells from the results themselves",
    detail: "Add to cart without leaving the list",
    marks: { native: "part", recs: "yes", plugins: "part", growmerce: "yes" },
  },
  {
    capability: "Ranks on what you can actually ship",
    detail: "Out of stock ranked down, not silently dropped",
    marks: { native: "part", recs: "no", plugins: "no", growmerce: "yes" },
  },
  {
    capability: "Reports the revenue it earned",
    detail: "Search-attributed checkouts, click-through, add-to-cart rate",
    marks: { native: "no", recs: "part", plugins: "no", growmerce: "yes" },
  },
  {
    capability: "Tells you what you don’t stock",
    detail: "Every zero-result term, collected as a buying list",
    marks: { native: "no", recs: "no", plugins: "no", growmerce: "yes" },
  },
  {
    capability: "Wears your theme on arrival",
    detail: "Nothing to design, no widget bolted to the corner",
    marks: { native: "yes", recs: "part", plugins: "no", growmerce: "yes" },
  },
];

const LABEL: Record<Mark, string> = { yes: "Yes", part: "Partly", no: "No" };

/**
 * The capability matrix.
 *
 * The Figma writes the heading for this section and then leaves the space under
 * it empty, so the substance of a comparison page is the one thing the mock
 * does not contain. This is that table, argued at the level of categories.
 *
 * It is fluid rather than a fixed-width table in a sideways scroller. A table
 * wide enough to need scrolling also sets the document's minimum layout width,
 * and Chrome then hands a phone a 728px viewport with 340px of blank space to
 * pan into — nothing is clipped, the page is just wrong. Five columns share the
 * width and the type steps down instead; five columns is what a comparison is.
 */
export default function CapabilityTable() {
  return (
    <div>
      <div className="overflow-hidden rounded-[22px] ring-1 ring-line">
        <table role="table" className="cap-matrix w-full table-fixed border-collapse bg-white text-left">
          <caption className="sr-only">
            Capabilities of native store search, recommendation apps, general AI
            plugins and Growmerce compared
          </caption>
          <thead role="rowgroup">
            <tr role="row">
              <th
                role="columnheader"
                scope="col"
                className="sm:w-[38%] px-3 py-3 text-[10px] font-bold tracking-[0.12em] text-muted uppercase sm:px-5 sm:py-4 sm:text-[13px] sm:tracking-[0.14em] md:w-[34%]"
              >
                Capability
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  role="columnheader"
                  scope="col"
                  className={`px-1.5 py-3 text-center font-poppins text-[11px] leading-tight font-extrabold sm:px-3 sm:py-4 sm:text-[14px] sm:leading-snug ${
                    col.key === "growmerce"
                      ? "bg-peach/60 text-brand"
                      : "text-charcoal/70"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {ROWS.map((row) => (
              <tr key={row.capability} role="row" className="border-t border-line">
                <th role="rowheader" scope="row" className="px-3 pt-3.5 pb-2 font-normal sm:px-5 sm:py-4">
                  <span className="block text-[13.5px] leading-snug font-bold text-charcoal sm:text-[15.5px]">
                    {row.capability}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-body-mute sm:text-[13.5px]">
                    {row.detail}
                  </span>
                </th>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    role="cell"
                    data-label={col.label}
                    className={`px-1.5 py-3.5 text-center sm:px-3 sm:py-4 ${
                      col.key === "growmerce" ? "bg-peach/40" : ""
                    }`}
                  >
                    <Cell mark={row.marks[col.key]} strong={col.key === "growmerce"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* What each column means, so the ticks can be argued with. */}
      <p className="mt-5 max-w-[92ch] text-[14px] leading-relaxed text-body-mute">
        <span className="font-bold text-charcoal">How to read this.</span>{" "}
        <span className="font-semibold">Native store search</span> is what your
        platform ships with. <span className="font-semibold">Recommendation
        apps</span> surface related and upsell products but never touch the
        search bar. <span className="font-semibold">General AI plugins</span> are
        assistants bolted beside the storefront rather than built into its
        results. &ldquo;Partly&rdquo; means some products in the category do it,
        or do a piece of it &mdash; not that none of them do.
      </p>
    </div>
  );
}

function Cell({ mark, strong }: { mark: Mark; strong: boolean }) {
  if (mark === "yes") {
    return (
      <span
        className={`mx-auto grid size-6 place-items-center rounded-full sm:size-7 ${
          strong ? "bg-brand text-white" : "bg-brand/12 text-brand"
        }`}
      >
        <span className="sr-only">{LABEL.yes}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5 sm:size-4">
          <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (mark === "part") {
    return (
      <span className="mx-auto grid size-6 place-items-center rounded-full bg-charcoal/8 text-charcoal/55 sm:size-7">
        <span className="sr-only">{LABEL.part}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5 sm:size-4">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mx-auto grid size-6 place-items-center rounded-full bg-charcoal/5 text-charcoal/30 sm:size-7">
      <span className="sr-only">{LABEL.no}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3 sm:size-3.5">
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
