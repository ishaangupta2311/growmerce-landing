import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Faq from "@/components/site/Faq";
import Reveal from "@/components/site/Reveal";
import DemoStoreButton from "@/components/site/DemoStoreButton";
import Arrow from "@/components/site/Arrow";
import { Burst } from "@/components/site/Marks";
import StorefrontMock from "./components/StorefrontMock";
import SideBySide from "./components/SideBySide";
import CapabilityTable from "./components/CapabilityTable";

export const metadata: Metadata = {
  title: "Growmerce vs the alternatives",
  description:
    "Traditional search, recommendation apps and general AI plugins each solve a piece of it. Compare the capabilities that actually shape the ecommerce experience — and see the same search run through both.",
};

/* The Figma stacks these four beside the storefront. They are the argument the
   rest of the page then evidences, in the order a shopper meets them. */
const CLAIMS = [
  { icon: SearchIcon, title: "Understands", rest: "shopper intent" },
  { icon: CartIcon, title: "Connects", rest: "the full journey" },
  { icon: TrendIcon, title: "Drives", rest: "more revenue" },
  { icon: PersonIcon, title: "Gives you", rest: "real insights" },
];

const JOURNEY = [
  { icon: SearchIcon, title: "Search", rest: "with intent" },
  { icon: CubeIcon, title: "Find the", rest: "right products" },
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

const COMPARE_FAQ = [
  {
    q: "Do I have to replace my existing search app?",
    a: "Only if it is doing the same job. Growsearch installs alongside your theme and takes over the search bar; if you are running a filter or merchandising app that does something else, it stays. What you should not do is run two things both claiming the search results — pick one.",
  },
  {
    q: "How is this different from adding an AI chatbot?",
    a: "A chatbot sits beside the storefront and answers questions. Growsearch is inside the results — it reads the query, ranks the catalogue, recovers the dead ends and reports what the searches earned. Shoppers never have to notice they are talking to anything.",
  },
  {
    q: "Recommendation apps already lift my AOV. Why add search?",
    a: "They work on shoppers who are already looking at something. Search is the shopper who told you exactly what they wanted before you showed them anything — and it is the one place a wrong answer ends the session instead of shaping it.",
  },
  {
    q: "Can I compare it against what I have now?",
    a: "That is the intended way to buy it. The 14-day trial runs on your own catalogue, and zero-result rate and search-attributed checkouts are visible from day one, so the comparison is against your store's own numbers rather than anyone's marketing page — including this one.",
  },
  {
    q: "What if my catalogue is messy?",
    a: "Metafields and custom attributes are indexed, out-of-stock products are ranked down rather than hidden, and drafts and archived products are excluded. Messy catalogues are where the gap between keyword matching and intent is widest.",
  },
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
                &ndash; Compare
              </p>
              <h1
                className="hero-enter mt-5 text-[clamp(2rem,5.2vw,4.5rem)] leading-[1.04] font-extrabold tracking-tight text-balance"
                style={{ animationDelay: "90ms" }}
              >
                Same goal.
                <br />
                A very different{" "}
                <span className="text-brand">experience.</span>
              </h1>
              <p
                className="hero-enter mt-7 max-w-[52ch] text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-relaxed text-body-mute"
                style={{ animationDelay: "170ms" }}
              >
                Traditional search, recommendation tools and AI plugins solve
                bits and pieces. Growmerce brings it all together &mdash;
                understanding shoppers, not just keywords.
              </p>
              <div
                className="hero-enter mt-9 flex flex-wrap items-center gap-4 [&>*]:max-[430px]:w-full"
                style={{ animationDelay: "250ms" }}
              >
                <DemoStoreButton className="cta-primary" source="compare-hero" />
                <Link href="/pricing" className="cta-secondary">
                  Try it free
                </Link>
              </div>

              {/* The four claims. Beside the mock on a wide screen, under the
                  copy on a narrow one — they read as captions to it either way. */}
              <ul
                className="hero-enter mt-10 grid gap-3 sm:grid-cols-2 lg:mt-12"
                style={{ animationDelay: "330ms" }}
              >
                {CLAIMS.map((claim) => (
                  <li
                    key={claim.title}
                    className="flex items-center gap-3 rounded-[14px] bg-cream px-4 py-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-brand">
                      <claim.icon className="size-5" />
                    </span>
                    <span className="text-[14.5px] leading-tight">
                      <span className="block font-bold text-charcoal">
                        {claim.title}
                      </span>
                      <span className="block text-body-mute">{claim.rest}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* min-w-0: a grid item's automatic minimum is its min-content
                width, so without this the mock's nowrap query string sets the
                track's minimum — and with it the page's minimum layout width,
                which hands a 320px phone a 370px viewport to pan around in. */}
            <div
              className="hero-enter-scale relative min-w-0"
              style={{ animationDelay: "150ms" }}
            >
              {/* The peach wash the Figma paints behind the device. */}
              <span
                aria-hidden
                className="absolute -inset-x-6 -top-10 bottom-4 -z-10 rounded-[48px] bg-[radial-gradient(120%_90%_at_70%_20%,var(--color-peach),transparent_72%)]"
              />
              <StorefrontMock />

              <span className="absolute -top-5 right-4 hidden items-center gap-2 rounded-[12px] bg-white px-3.5 py-2 text-[13px] leading-tight font-bold text-charcoal shadow-[0_14px_32px_-18px_rgba(23,23,23,0.5)] ring-1 ring-brand/15 sm:flex">
                <Burst className="size-4 text-brand" />
                Understands natural language
              </span>
              <span className="absolute -bottom-5 left-6 hidden items-center gap-2 rounded-[12px] bg-white px-3.5 py-2 text-[13px] leading-tight font-bold text-charcoal shadow-[0_14px_32px_-18px_rgba(23,23,23,0.5)] ring-1 ring-brand/15 sm:flex">
                <TrendIcon className="size-4 text-brand" />
                Turns searches into sales
              </span>

              <p className="mt-8 max-w-[24ch] -rotate-2 font-hand text-[21px] leading-tight font-medium text-brand lg:absolute lg:-right-4 lg:-bottom-24 lg:mt-0">
                More than a search tool. A complete discovery experience.
              </p>
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
                It&rsquo;s not just about{" "}
                <span className="text-brand">search results.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[56ch] text-center text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-body-mute">
                It&rsquo;s about what happens next &mdash; discovery,
                engagement, and growth.
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
            <p className="mt-8 max-w-[80ch] text-[14.5px] leading-relaxed text-body-mute">
              These are published results from other vendors in the category,
              not Growmerce results &mdash; we have not been running long enough
              to have our own, and we would rather you measured us against your
              own store than against anyone&rsquo;s number. The trial reports
              zero-result rate and search-attributed checkouts from day one, so
              you can.
            </p>
          </section>
        </Reveal>

        {/* Closing */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-16">
          <div className="flex flex-col items-center gap-6 rounded-[26px] bg-brand px-8 py-12 text-center text-white">
            <h2 className="max-w-[24ch] text-[clamp(1.75rem,3.4vw,3rem)] leading-tight font-extrabold text-balance">
              Run the same search through both
            </h2>
            <p className="max-w-[52ch] text-[17px] text-white/90">
              The demo store is a real storefront with Growsearch on it. Ask it
              something your own search bar would fumble, and see which one
              answers.
            </p>
            <DemoStoreButton className="cta-primary-inverse" source="compare-closing">
              See demo
              <Arrow className="size-5" />
            </DemoStoreButton>
          </div>
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

function PersonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="8" r="4.1" {...STROKE} />
      <path d="M4.4 20.4a7.6 7.6 0 0 1 15.2 0" {...STROKE} />
    </svg>
  );
}
