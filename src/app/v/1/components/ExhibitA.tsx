import Image from "next/image";
import Link from "next/link";
import styles from "../ledger.module.css";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";

const HIGHLIGHTS = [
  {
    no: "i",
    title: "Never-zero-results recovery",
    body: "Typos get fixed automatically, and a dead-end search still returns something close — nobody hits a blank page.",
  },
  {
    no: "ii",
    title: "Plain-language search",
    body: "“Skincare under $10” just works. Shoppers search the way they'd ask a friend, not the way a filter menu expects.",
  },
  {
    no: "iii",
    title: "Add to cart from results",
    body: "Shoppers add straight from the results grid — the cart updates instantly, no detour through a product page.",
  },
  {
    no: "iv",
    title: "Search-attributed revenue",
    body: "Merchant analytics tie individual searches to checkouts, so you can see exactly what search sells.",
  },
];

const PIPELINE = [
  { no: "02", width: "58%" },
  { no: "03", width: "38%" },
];

export default function ExhibitA() {
  return (
    <section id="products" className="scroll-mt-20 border-b border-[var(--ink-15)] bg-[var(--paper-deep)]/50">
      <div className="mx-auto max-w-[1180px] px-6 py-20 sm:px-10 sm:py-28">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
              § 02 · Exhibit A
            </p>
            <div className="draw-line h-px flex-1 bg-[var(--ink-15)]" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <h2 className={`${styles.serif} text-[2rem] leading-[1.12] font-semibold sm:text-[2.6rem]`}>
              Growsearch — search that never dead-ends.
            </h2>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.1em] text-[var(--ink-70)] uppercase">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
            Live — launching now on the Shopify App Store
          </div>
          <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-[var(--ink-70)] sm:text-lg">
            Growmerce&rsquo;s first tool: AI storefront search built for
            Shopify stores, paired with analytics that prove what search
            sells. It&rsquo;s the first line of Growmerce&rsquo;s ledger — the
            rest of this page is the thesis behind it.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
          <Reveal delay={80}>
            <ol className="divide-y divide-[var(--ink-15)] border-t border-[var(--ink-15)]">
              {HIGHLIGHTS.map((h) => (
                <li key={h.no} className="flex gap-5 py-6">
                  <span className={`${styles.serif} shrink-0 text-[1.2rem] italic text-[var(--ink-25)]`}>
                    {h.no}
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold text-[var(--ink)]">{h.title}</p>
                    <p className="mt-1.5 max-w-[52ch] text-[15px] leading-relaxed text-[var(--ink-55)]">
                      {h.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="#"
                className="inline-flex items-center gap-3 bg-[var(--ink)] px-7 py-3.5 text-[15px] font-semibold text-[var(--paper)] transition-transform duration-200 hover-lift"
              >
                Explore Growsearch
                <Arrow className="h-4 w-4" />
              </Link>
              <p className="text-[13px] text-[var(--ink-40)] italic">
                Growsearch&rsquo;s own site is coming soon.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <figure className="relative overflow-hidden border border-[var(--ink-15)] bg-[var(--paper)] shadow-glow">
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src="/img/smart-search-mock.png"
                  alt="Growsearch storefront results for &ldquo;55 inch Sony TV under ₹50,000 with Dolby Vision&rdquo;, with a search-performance panel showing click-through rate."
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="border-t border-[var(--ink-15)] px-5 py-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--ink-40)] uppercase">
                Fig. 1 — Growsearch, live storefront results
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-14">
          <div className="border border-[var(--ink-15)] bg-peach/40 p-7 sm:p-10">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-40)] uppercase">
              Exhibit A.1 — Recovery in action
            </p>
            <div className="mt-5 space-y-3">
              <p className="text-[15px] text-[var(--ink-55)]">
                Shopper searches —
                <span className="ml-2 font-semibold text-[var(--ink)]">&ldquo;kava drinks&rdquo;</span>
              </p>
              <p className={`${styles.serif} text-[1.15rem] leading-snug italic text-[var(--ink-85)] sm:text-[1.3rem]`}>
                &ldquo;We don&rsquo;t have kava drinks — but you might like
                these Kratom Seltzers.&rdquo;
              </p>
              <p className="text-[13px] text-[var(--ink-40)]">— Growsearch, zero-results recovery</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-16 border-t border-[var(--ink-15)] pt-10">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-40)] uppercase">
            What&rsquo;s next
          </p>
          <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed text-[var(--ink-70)]">
            More tools are in development — the same doctrine, workflow depth
            over feature breadth, applied to the next problem on the shelf.
          </p>
          <div className="mt-8 divide-y divide-[var(--ink-15)] border-t border-[var(--ink-15)]">
            {PIPELINE.map((row) => (
              <div key={row.no} className="flex items-center gap-5 py-4">
                <span className={`${styles.serif} w-6 shrink-0 text-[1rem] italic text-[var(--ink-25)]`}>
                  {row.no}
                </span>
                <span className={`${styles.redactedBar} max-w-[220px] flex-1`} style={{ width: row.width }} aria-hidden />
                <span className="ml-auto shrink-0 text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-40)] uppercase">
                  In development
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
