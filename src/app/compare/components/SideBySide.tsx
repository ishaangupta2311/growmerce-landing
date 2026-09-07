import Image from "next/image";
import { Sparkle } from "@/components/site/Marks";

const QUERY = "gifts for coffee lovers";

/* Keyword match on "coffee" and "mug". Four things that contain the words and
   none that answer the sentence — the point of the left-hand panel. */
const PLAIN = [
  { src: "mug-ceramic", name: "Ceramic Mug", price: "$12.00" },
  { src: "mug-classic", name: "Classic Mug", price: "$10.00" },
  { src: "beans-plain", name: "Coffee Beans", price: "$18.00" },
  { src: "mug-travel", name: "Travel Mug", price: "$22.00" },
];

const SMART = [
  { src: "gift-set", name: "Coffee Gift Set", price: "$34.00" },
  { src: "pour-over", name: "Pour Over Kit", price: "$28.00" },
  { src: "beans-specialty", name: "Specialty Beans", price: "$16.00" },
  { src: "tumbler", name: "Insulated Tumbler", price: "$24.00" },
];

const PLAIN_NOTES = ["Keyword match only", "Generic results", "Often misses intent"];
const SMART_NOTES = ["Understands context", "Shows relevant results", "Delivers a better shopping experience"];

/**
 * The same query put to both, side by side — the page's central claim, and the
 * one place a reader can check it rather than take it.
 *
 * The Figma ships this as a single 1999px bitmap. Every product name, price and
 * annotation in it is painted on, which on a phone means a wall of unreadable
 * type and, to a search engine, an empty section. Rebuilt here in markup: the
 * photography carries over, everything with a word in it is text, and the two
 * panels stack rather than shrink when the column runs out.
 */
export default function SideBySide() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0">
      <Panel
        tone="plain"
        badge="Traditional search"
        notes={PLAIN_NOTES}
        products={PLAIN}
        footer={
          <div className="flex items-start gap-3 rounded-[12px] bg-[#f2f2f2] px-4 py-3.5">
            <span
              aria-hidden
              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-charcoal/20 text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <span>
              <span className="block text-[13.5px] font-bold text-charcoal sm:text-[15px]">
                We couldn&rsquo;t find what you were looking for.
              </span>
              <span className="mt-0.5 block text-[12.5px] text-body-mute sm:text-[13.5px]">
                Try different keywords or browse our collections.
              </span>
            </span>
          </div>
        }
      />

      {/* The hinge. Between the columns on a wide screen, between the stacked
          panels on a narrow one. */}
      <div
        aria-hidden
        className="relative z-10 mx-auto grid size-12 place-items-center rounded-full bg-white font-poppins text-[15px] font-extrabold text-brand shadow-[0_10px_26px_-12px_rgba(23,23,23,0.45)] ring-1 ring-brand/20 lg:-mx-6 lg:self-center"
      >
        VS
      </div>

      <Panel
        tone="smart"
        badge="Growmerce AI"
        notes={SMART_NOTES}
        products={SMART}
        footer={
          <div className="flex items-start gap-3 rounded-[12px] bg-peach/70 px-4 py-3.5">
            <span
              aria-hidden
              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="self-center text-[13.5px] leading-snug font-bold text-charcoal sm:text-[15px]">
              <span className="text-brand">Understands shopper intent</span> and
              delivers <span className="text-brand">curated results</span>.
            </span>
          </div>
        }
      />
    </div>
  );
}

function Panel({
  tone,
  badge,
  notes,
  products,
  footer,
}: {
  tone: "plain" | "smart";
  badge: string;
  notes: string[];
  products: { src: string; name: string; price: string }[];
  footer: React.ReactNode;
}) {
  const smart = tone === "smart";
  return (
    <section
      aria-label={badge}
      className={`rounded-[22px] p-5 sm:p-6 ${
        smart
          ? "bg-white ring-2 ring-brand/35 lg:pl-10"
          : "bg-[#fafafa] ring-1 ring-line lg:pr-10"
      }`}
    >
      <p
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-poppins text-[13px] font-bold sm:text-[14px] ${
          smart ? "bg-brand text-white" : "bg-charcoal/25 text-white"
        }`}
      >
        {badge}
        {smart ? <Sparkle className="size-3.5" /> : null}
      </p>

      <div
        className={`mt-4 flex items-center gap-2.5 rounded-full bg-white px-3.5 py-2.5 sm:gap-3 ${
          smart ? "ring-1 ring-brand/25" : "ring-1 ring-line"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4 shrink-0 text-charcoal/70">
          <circle cx="10.5" cy="10.5" r="6.7" stroke="currentColor" strokeWidth="2.2" />
          <path d="m15.4 15.4 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-[13px] text-charcoal sm:text-[14.5px]">
          {QUERY}
        </span>
        {smart ? (
          <>
            <Sparkle className="size-3.5 shrink-0 text-brand" />
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-white">
              <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5 shrink-0 text-muted">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {products.map((p) => (
          <li key={p.src} className="min-w-0">
            <span className="relative block">
              <Image
                src={`/img/compare/${p.src}.webp`}
                alt=""
                width={142}
                height={151}
                sizes="(min-width: 1024px) 120px, 21vw"
                className="h-auto w-full rounded-[8px] bg-[#f2f2f2]"
              />
              {smart ? (
                <svg viewBox="0 0 24 24" aria-hidden className="absolute top-1.5 right-1.5 size-3.5 fill-none stroke-brand stroke-[2.2] sm:size-4">
                  <path d="M12 20.2 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13z" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
            <p className="mt-2 truncate text-[10.5px] leading-tight font-medium text-charcoal sm:text-[12px]">
              {p.name}
            </p>
            <p className="text-[10.5px] leading-tight text-body-mute sm:text-[12px]">
              {p.price}
            </p>
            {smart ? (
              <p className="mt-1.5 rounded-[5px] border border-brand py-[3px] text-center text-[9px] font-bold text-brand sm:text-[10.5px]">
                Add to cart
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-4">{footer}</div>

      {/* The Figma writes these in the margin in a hand. There is no margin on a
          phone, so they sit under the panel they belong to. */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
        {notes.map((note) => (
          <li
            key={note}
            className={`font-hand text-[17px] leading-snug font-medium sm:text-[19px] ${
              smart ? "text-brand" : "text-muted"
            }`}
          >
            {note}
          </li>
        ))}
      </ul>
    </section>
  );
}
