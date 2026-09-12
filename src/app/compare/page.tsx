import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Faq from "@/components/site/Faq";
import { COMPARE_FAQ } from "@/lib/faqs";
import Reveal from "@/components/site/Reveal";
import DemoStoreButton from "@/components/site/DemoStoreButton";
import Arrow from "@/components/site/Arrow";
import SideBySide from "./components/SideBySide";
import CapabilityTable from "./components/CapabilityTable";

export const metadata: Metadata = {
  title: "Growmerce vs the alternatives",
  description:
    "Traditional search, recommendation apps and general AI plugins each solve a piece of it. Compare the capabilities that actually shape the ecommerce experience — and see the same search run through both.",
};

const JOURNEY = [
  { icon: SearchIcon, title: "Search", rest: "with intent" },
  { icon: CubeIcon, title: "Find", rest: "the right products" },
  { icon: CartIcon, title: "Add to cart", rest: "effortlessly" },
  { icon: TrendIcon, title: "Grow", rest: "your revenue" },
];

/* Published results from other vendors in the category. They are not ours, and
   the note under them says so — the Figma's own numbers (2.5x, 40%, 3x) carry
   no source, and an unattributable conversion claim on a comparison page is
   the one thing on it a competitor could fairly complain about. */
const BENCHMARKS = [
  { figure: "10–30%", label: "conversion lift from AI shopping assistants", source: "Rep AI" },
  { figure: "6×", label: "better conversion for assisted shoppers at Kendra Scott", source: "iAdvize" },
  { figure: "+20%", label: "average order value in early access to Loomi", source: "Bloomreach" },
];

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-14 pb-12 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div>
              <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
                Growmerce vs traditional search
              </p>
              <h1
                className="hero-enter mt-5 text-[clamp(2rem,5.2vw,4.5rem)] leading-[1.04] font-extrabold tracking-tight text-balance"
                style={{ animationDelay: "90ms" }}
              >
                Traditional Search Stops At Keywords.
                <br />
                Growmerce Understands{" "}
                <span className="text-brand">Intent</span>
              </h1>
              <p
                className="hero-enter mt-7 max-w-[52ch] text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-relaxed text-body-mute"
                style={{ animationDelay: "170ms" }}
              >
                <span className="block">
                  Traditional site search, recommendation engines, and
                  standalone AI tools solve isolated parts of product
                  discovery.
                </span>
                <span className="mt-4 block">
                  Growmerce connects intent, relevance, merchandising, shopper
                  behavior, and revenue into one search experience that moves
                  customers closer to purchase.
                </span>
              </p>
              <div
                className="hero-enter mt-9 flex flex-wrap items-center gap-4 [&>*]:max-[430px]:w-full"
                style={{ animationDelay: "250ms" }}
              >
                <DemoStoreButton className="cta-primary" source="compare-hero">
                  See Growsearch in Action
                </DemoStoreButton>
                <Link href="/try" className="cta-secondary">
                  Try Growsearch Free
                </Link>
              </div>
            </div>

            {/* min-w-0: a grid item's automatic minimum is its min-content
                width, so without this the mock's nowrap query string sets the
                track's minimum — and with it the page's minimum layout width,
                which hands a 320px phone a 370px viewport to pan around in. */}
            {/* The Figma's staged artwork, used whole. At the width this column
                gives it the 1239px source lands within a hair of retina, and
                the chips and note it carries are part of the picture. */}
            <div
              className="hero-enter-scale relative min-w-0"
              style={{ animationDelay: "150ms" }}
            >
              <Image
                src="/img/compare/hero-laptop.webp"
                alt="A Growmerce storefront answering “summer dresses under $100” with four in-stock dresses, showing how it understands real shopper intent, ranks products by relevance, connects search to conversion, and turns behavior into insight"
                width={1239}
                height={1261}
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* The journey */}
        <section
          aria-labelledby="journey-title"
          className="mt-16 bg-peach/70 py-14 lg:mt-28 lg:py-20"
        >
          <div className="mx-auto max-w-[1370px] px-6">
            <Reveal>
              <h2
                id="journey-title"
                className="text-center font-poppins text-[clamp(1.6rem,3.6vw,2.75rem)] leading-tight font-extrabold text-balance"
              >
                Search Is Only the Start.{" "}
                <span className="text-brand">Revenue Is the Outcome</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[56ch] text-center text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-body-mute">
                Growsearch connects every step between shopper intent and
                purchase, so better searches lead to better product discovery,
                stronger cart activity, and measurable growth.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-4">
                {JOURNEY.map((step, i) => (
                  <li key={step.title} className="relative text-center">
                    <span className="mx-auto grid size-[74px] place-items-center rounded-full bg-white text-brand shadow-[0_16px_36px_-18px_rgba(255,90,31,0.6)]">
                      <step.icon className="size-9" />
                    </span>
                    <p className="mt-5 font-poppins text-[clamp(1.125rem,1.8vw,1.5rem)] leading-tight font-extrabold text-charcoal">
                      {step.title}
                    </p>
                    <p className="mt-1 text-[clamp(1rem,1.5vw,1.25rem)] leading-tight text-body-mute">
                      {step.rest}
                    </p>
                    {/* The arrow belongs between two steps, so it only exists
                        where they actually sit side by side. */}
                    {i < JOURNEY.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute top-[30px] -right-2 hidden text-brand lg:block"
                      >
                        <Arrow className="size-6" />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* Side by side */}
        <section
          aria-labelledby="difference-title"
          className="mx-auto max-w-[1370px] px-6 py-16 lg:py-24"
        >
          <Reveal>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <h2
                id="difference-title"
                className="font-poppins text-[clamp(1.75rem,4vw,3.25rem)] leading-tight font-extrabold tracking-tight text-balance"
              >
                See the difference{" "}
                <span className="text-brand">for yourself.</span>
              </h2>
              <p className="max-w-[34ch] text-[16.5px] leading-relaxed text-body-mute lg:text-right">
                Same shopper. Same search. A completely different experience.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-10 lg:mt-14">
            <SideBySide />
          </Reveal>
        </section>

        {/* The matrix */}
        <section
          aria-labelledby="matrix-title"
          className="mx-auto max-w-[1370px] px-6 pb-16 lg:pb-24"
        >
          <Reveal>
            <h2
              id="matrix-title"
              className="mx-auto max-w-[22ch] text-center font-poppins text-[clamp(1.75rem,4vw,3.25rem)] leading-tight font-extrabold tracking-tight text-balance"
            >
              Not just better search.{" "}
              <span className="text-brand">A smarter way to grow.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[56ch] text-center text-[17px] leading-relaxed text-body-mute">
              Compare the capabilities that actually shape the ecommerce
              experience.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-10 lg:mt-14">
            <CapabilityTable />
          </Reveal>
        </section>

        {/* What the category shows */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-16">
          <section
            aria-labelledby="benchmarks-title"
            className="rounded-[26px] bg-cream px-7 py-10 ring-1 ring-brand/15 sm:px-10"
          >
            <h2
              id="benchmarks-title"
              className="font-poppins text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold text-charcoal"
            >
              What the category already shows
            </h2>
            <dl className="mt-8 grid gap-8 sm:grid-cols-3">
              {BENCHMARKS.map((b) => (
                <div key={b.source}>
                  <dt className="font-poppins text-[clamp(2rem,3.6vw,2.75rem)] leading-none font-extrabold text-brand">
                    {b.figure}
                  </dt>
                  <dd className="mt-2.5 text-[15px] leading-snug text-body-mute">
                    {b.label}
                    <span className="mt-1.5 block text-[13px] font-bold tracking-wide text-charcoal/60 uppercase">
                      {b.source}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>

        {/* Closing */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-24 lg:pb-32">
          <section
            aria-labelledby="closing-title"
            className="relative rounded-[26px] bg-[linear-gradient(105deg,var(--color-cream),var(--color-peach))] px-7 pt-10 sm:px-10 lg:pt-12"
          >
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-10">
              <div className="pb-10 lg:pb-12">
                <p className="font-poppins text-[clamp(0.9rem,1.5vw,1.125rem)] font-extrabold tracking-[0.06em] text-brand uppercase">
                  Ready to see the difference?
                </p>
                <h2
                  id="closing-title"
                  className="mt-3 max-w-[16ch] font-poppins text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.06] font-extrabold tracking-tight text-charcoal text-balance"
                >
                  Turn more searches into loyal customers.
                </h2>
                <p className="mt-5 max-w-[46ch] text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-body-mute">
                  Join growing brands using Growmerce to create smarter, more
                  personalized shopping experiences.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4 [&>*]:max-[430px]:w-full">
                  <Link href="/try" className="cta-primary">
                    Try it free
                    <Arrow className="cta-arrow size-5" />
                  </Link>
                  <DemoStoreButton className="cta-secondary" source="compare-closing" />
                </div>
              </div>

              {/* It hangs off the bottom edge, as drawn — which is why the
                  panel does not clip its overflow and the section below leaves
                  room for the overhang. */}
              <Image
                src="/img/compare/cta-laptop.webp"
                alt="Growsearch running on a storefront, answering a shopper's question with products they can add to the cart from the results"
                width={902}
                height={782}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="-mb-10 h-auto w-full self-end lg:-mb-16"
              />
            </div>
          </section>
        </Reveal>

        <Faq items={COMPARE_FAQ} />
      </main>
      <Footer />
    </>
  );
}

/* Icons — drawn here rather than exported, for the same reason as the rest of
   the site's: the Figma bakes them into flattened artwork. */
type IconProps = { className?: string };

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="10.5" cy="10.5" r="6.7" {...STROKE} />
      <path d="m15.4 15.4 5 5" {...STROKE} />
    </svg>
  );
}

function CubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" {...STROKE} />
      <path d="M3.5 7 12 11.4 20.5 7M12 11.4v9.8" {...STROKE} />
    </svg>
  );
}

function CartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M2.6 3.4h2.6l2.3 11.1h9.9l2-7.6H6.4" {...STROKE} />
      <circle cx="9.4" cy="19.4" r="1.7" {...STROKE} />
      <circle cx="16.6" cy="19.4" r="1.7" {...STROKE} />
    </svg>
  );
}

function TrendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M3.5 16.75 9.25 11l3.5 3.5L20.5 6.75" {...STROKE} />
      <path d="M14.75 6.75h5.75v5.75" {...STROKE} />
    </svg>
  );
}
