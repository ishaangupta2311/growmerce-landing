import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CtaPair from "@/components/site/CtaPair";
import Faq from "@/components/site/Faq";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Native storefront search matches strings, not intent. Growsearch turns failed searches into sales — same catalog, same traffic, different outcome.",
};

/* Figma leaves the "leak" panel empty; these are the four leaks it frames. */
const LEAKS = [
  {
    stat: "1 in 7",
    label: "searches ends in nothing",
    body: "Industry-wide, roughly one in seven storefront searches returns zero results. Every one of them is a shopper who told you exactly what they wanted, and got a blank page for it.",
  },
  {
    stat: "0",
    label: "words of feedback",
    body: "A failed search does not raise a support ticket. It closes a tab. Without search analytics you never learn which products your customers thought you sold.",
  },
  {
    stat: "3×",
    label: "intent, versus browsing",
    body: "Shoppers who use search are far closer to buying than shoppers who browse. Sending them to a dead end is the most expensive moment on your storefront.",
  },
  {
    stat: "100%",
    label: "of it is measurable",
    body: "Zero-result rate, click-through, add-to-cart and search-attributed checkouts are all knowable numbers. Most stores simply never look at them.",
  },
];

const COMPARE = [
  {
    without: "Matches strings — “kava drinks” returns nothing",
    with: "Reads intent — offers the nearest real shelf instead",
  },
  {
    without: "Shopper has to learn your filter menus",
    with: "“Skincare under $10” just works, no filters touched",
  },
  {
    without: "Typos and plurals quietly kill the sale",
    with: "Corrected automatically before results render",
  },
  {
    without: "Results page is a dead end when stock runs out",
    with: "Close alternatives shown, ranked down but never hidden",
  },
  {
    without: "You cannot tell which searches earned money",
    with: "Search-attributed checkouts tracked to the product",
  },
];

const SOLUTIONS_FAQ = [
  {
    q: "Does Growsearch replace my Shopify search or sit on top of it?",
    a: "It sits on top. Your native results still render instantly — Growsearch layers intent matching, recovery and ranking over them, so the shopper never waits on a model and nothing breaks if the AI has an off day.",
  },
  {
    q: "We already have a filter app. Is this the same thing?",
    a: "No. Filters make the shopper do the work of narrowing. Growsearch reads the narrowing out of their sentence, and lets them keep adjusting it in conversation — “only under $20”, “actually show me sunscreens instead”.",
  },
  {
    q: "How quickly would we see whether it helped?",
    a: "Within the trial. Zero-result rate and search-attributed checkouts are visible from day one, so the comparison is against your own store's numbers rather than a case study.",
  },
  {
    q: "What about stores with huge or messy catalogues?",
    a: "That's the case it's built for. Metafields and custom attributes are indexed, out-of-stock items are ranked down rather than hidden, and drafts and archived products are excluded.",
  },
];

export default function SolutionsPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-14 pb-12 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div>
              <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
                &ndash; Solutions
              </p>
              <h1
                className="hero-enter mt-5 text-[clamp(2rem,5.6vw,5rem)] leading-[1.04] font-extrabold tracking-tight text-balance"
                style={{ animationDelay: "90ms" }}
              >
                Everything your search bar{" "}
                <span className="text-brand">should have been doing</span>
              </h1>
              <p
                className="hero-enter mt-7 max-w-[54ch] text-[clamp(1.0625rem,1.6vw,1.5rem)] leading-relaxed text-body-mute"
                style={{ animationDelay: "170ms" }}
              >
                Native Shopify search matches strings, not intent. Every query it
                fails is a shopper who was ready to buy &mdash; and left without
                telling you.
              </p>
              <CtaPair
                className="mt-9"
                primaryHref="/pricing"
                secondaryHref={GROWSEARCH_HOME}
                secondaryLabel="See Growsearch"
              />
            </div>

            <div
              className="hero-enter-scale relative overflow-hidden rounded-[20px] bg-peach/50 p-4"
              style={{ animationDelay: "150ms" }}
            >
              <Image
                src="/img/smart-search-mock.png"
                alt="Growsearch results for a natural-language query, with match scores and a search-performance chart"
                width={1536}
                height={1024}
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="h-auto w-full rounded-[12px]"
              />
            </div>
          </div>
        </section>

        {/* The leak */}
        <Reveal className="mx-auto max-w-[1370px] px-6 py-14">
          <section
            aria-labelledby="leak-title"
            className="relative overflow-hidden rounded-[24px] bg-peach/70 py-12 pr-8 pl-9 sm:pl-14"
          >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[10px] bg-brand" />
            <h2
              id="leak-title"
              className="text-center text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold text-brand"
            >
              The leak nobody&rsquo;s watching
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {LEAKS.map((leak) => (
                <div key={leak.label}>
                  <p className="font-poppins text-[clamp(2rem,3.4vw,2.75rem)] leading-none font-extrabold text-charcoal">
                    {leak.stat}
                  </p>
                  <p className="mt-1.5 text-[14px] font-bold tracking-wide text-brand uppercase">
                    {leak.label}
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-body-mute">
                    {leak.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* The shift */}
        <section
          aria-labelledby="shift-title"
          className="mx-auto max-w-[1370px] px-6 py-16 lg:py-24"
        >
          <Reveal>
            <p className="font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
              &ndash; The shift
            </p>
            <h2
              id="shift-title"
              className="mt-4 max-w-[22ch] text-[clamp(2rem,4.4vw,4rem)] leading-[1.06] font-extrabold tracking-tight text-balance"
            >
              Same catalog. Same traffic. Different outcome.
            </h2>
          </Reveal>

          <Reveal delay={120} className="mt-12">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Without */}
              <div className="rounded-[22px] bg-[#f5f5f5] p-7 sm:p-9">
                <p className="font-poppins text-[13px] font-extrabold tracking-[0.16em] text-muted uppercase">
                  Without Growmerce
                </p>
                <ul className="mt-6 space-y-4">
                  {COMPARE.map((row) => (
                    <li key={row.without} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-charcoal/12 text-charcoal/60"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="text-[16px] leading-snug text-body-mute">
                        {row.without}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* With */}
              <div className="rounded-[22px] bg-peach/70 p-7 ring-1 ring-brand/30 sm:p-9">
                <p className="font-poppins text-[13px] font-extrabold tracking-[0.16em] text-brand uppercase">
                  With Growmerce
                </p>
                <p className="mt-3 text-[clamp(1.25rem,2.2vw,2rem)] font-extrabold">
                  Search that understands meaning
                </p>
                <ul className="mt-6 space-y-4">
                  {COMPARE.map((row) => (
                    <li key={row.with} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-[16px] leading-snug font-medium text-charcoal">
                        {row.with}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="mt-10">
            <div className="rounded-[20px] bg-[#fff8f4] px-7 py-6 ring-1 ring-brand/25">
              <p className="text-[15px] leading-relaxed text-body-mute">
                <span className="font-bold text-charcoal">
                  What the category already shows.
                </span>{" "}
                AI shopping assistants report 10&ndash;30% conversion lift and
                16%+ AOV lift (Rep AI); assisted shoppers converted 6&times;
                better than unassisted ones at Kendra Scott (iAdvize); early
                access to Bloomreach&rsquo;s Loomi averaged +9% CVR and +20% AOV.
                These are published category benchmarks from other vendors, not
                Growmerce results &mdash; we would rather you measured us against
                your own store.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Unit opens */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-8">
          <Image
            src="/img/pages/unit-opens.png"
            alt="Growsearch turning a shopper's question into matching products"
            width={1653}
            height={1072}
            sizes="100vw"
            className="h-auto w-full rounded-[24px]"
          />
        </Reveal>

        {/* Closing CTA */}
        <Reveal className="mx-auto max-w-[1370px] px-6 py-16">
          <div className="flex flex-col items-center gap-6 rounded-[26px] bg-brand px-8 py-12 text-center text-white">
            <h2 className="max-w-[26ch] text-[clamp(1.75rem,3.4vw,3rem)] leading-tight font-extrabold">
              Find out what your search bar has been hiding
            </h2>
            <p className="max-w-[52ch] text-[17px] text-white/90">
              Fifteen days, your own catalogue, your own shoppers. The
              zero-result list alone is usually worth the install.
            </p>
            <Link
              href="/pricing"
              className="cta-primary-inverse"
            >
              Start free trial
              <Arrow className="size-5" />
            </Link>
          </div>
        </Reveal>

        <Faq items={SOLUTIONS_FAQ} />
      </main>
      <Footer />
    </>
  );
}
