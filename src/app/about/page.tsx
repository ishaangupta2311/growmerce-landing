import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CtaPair from "@/components/site/CtaPair";
import Faq from "@/components/site/Faq";
import ProveItBand from "@/components/site/ProveItBand";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import { PlatformLogos } from "@/components/site/PlatformStrip";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

export const metadata: Metadata = {
  title: "What is Growmerce",
  description:
    "Growmerce owns, builds and runs practical AI tools for ecommerce. One tool at a time, installed into the store you already have.",
};

const CONVICTIONS = [
  "One tool at a time — Growsearch first, and the next one gets a name when it has customers",
  "It installs into the store you already run: no replatforming, no migration, no AI team",
  "Grounded in your catalogue — the model never invents a product, a price or a promise",
  "Every tool reports on itself, so it is judged on revenue rather than on vibes",
  "Priced as a flat monthly number you can cancel, with no revenue share",
];

const HOW_WE_WORK = [
  {
    title: "One tool at a time",
    body: "We own, build and run each tool end to end — no suite, no bundle, no seat minimums. Growsearch is the first: storefront search that never dead-ends, and the analytics to prove what search sells.",
  },
  {
    title: "Install today, not next quarter",
    body: "Every tool has to work inside the store you already run. Install it, keep your theme, your checkout and your data exactly where they are. No replatforming and no six-week onboarding.",
  },
  {
    title: "We charge from day one",
    body: "No free pilots dressed up as partnerships. Early pricing is honest pricing — a small monthly number you can cancel — because a store owner choosing to pay is the only proof a tool deserves to exist.",
  },
  {
    title: "Built in public",
    body: "Founder-led from Delhi, serving stores worldwide. Progress gets posted as it happens, and you get a straight answer when something isn't ready yet.",
  },
];

const UPDATES = [
  {
    tag: "Product",
    title: "Why Growsearch never shows a zero-result page",
    dek: "The design rule behind recovery, and what we log when a query finds nothing.",
  },
  {
    tag: "Engineering",
    title: "Native results first, AI second",
    dek: "How we layer semantic matching on top of Shopify search without adding latency.",
  },
  {
    tag: "Company",
    title: "Charging from day one",
    dek: "Why there are no free pilots here, and what that changes about the roadmap.",
  },
];

const ABOUT_FAQ = [
  {
    q: "So what is Growmerce, exactly?",
    a: "An ecommerce AI studio. We own, build and operate the tools ourselves rather than reselling somebody else's model — Growsearch today, more to follow once each one has paying customers.",
  },
  {
    q: "Why only one product?",
    a: "Because a half-built suite helps nobody. Growsearch has to earn its place with real stores before the second tool gets any engineering time. That's a deliberate constraint, not a stage we're embarrassed about.",
  },
  {
    q: "Who is behind it?",
    a: "It's founder-led out of Delhi, serving stores globally. The person who writes the code is the person who answers your demo call — which is an advantage while we're small, and we intend to keep it as long as possible.",
  },
  {
    q: "What's next after Growsearch?",
    a: "Whatever the searches tell us. The zero-result terms and shopper questions Growsearch collects are the best product roadmap we could ask for — so the next tool will come out of real customer behaviour, not a brainstorm.",
  },
  {
    q: "How do I get in touch?",
    a: "Drop your store URL in the form above and we'll come back with a teardown of the three workflows most likely costing you hours — before any call.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-16 pb-14 text-center lg:pt-24">
          <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.2em] text-brand uppercase">
            What is Growmerce
          </p>
          <h1
            className="hero-enter mx-auto mt-5 max-w-[26ch] text-[clamp(2rem,5.4vw,5rem)] leading-[1.05] font-extrabold tracking-tight text-balance"
            style={{ animationDelay: "90ms" }}
          >
            We build the AI tools store owners actually{" "}
            <span className="text-brand">keep</span>
          </h1>
          <p
            className="hero-enter mx-auto mt-7 max-w-[68ch] text-[clamp(1.0625rem,1.6vw,1.5rem)] leading-relaxed text-body-mute"
            style={{ animationDelay: "160ms" }}
          >
            AI became table stakes for online stores before most owners had
            anyone to build it. What&rsquo;s on offer is either a narrow gadget or
            a platform you&rsquo;d have to migrate onto. Growmerce is the
            practical middle: small, sharp tools that install into the store you
            already run &mdash; and prove themselves in your own numbers.
          </p>
          <CtaPair
            className="mt-10 justify-center"
            primaryHref="/pricing"
            secondaryHref={GROWSEARCH_HOME}
            secondaryLabel="See all our products"
          />
        </section>

        {/* You will find us on */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-16">
          <div className="flex flex-col items-center gap-7 rounded-[22px] border-2 border-brand bg-peach/60 px-8 py-6 lg:flex-row lg:justify-center lg:gap-14">
            <p className="shrink-0 font-poppins text-[clamp(1.125rem,1.8vw,1.5rem)] leading-tight font-extrabold text-brand uppercase">
              You will
              <br className="hidden lg:block" /> find us on
            </p>
            <PlatformLogos />
          </div>
        </Reveal>

        {/* Orange convictions band */}
        <section aria-labelledby="convictions-title" className="bg-brand py-16 text-white lg:py-24">
          <div className="mx-auto grid max-w-[1370px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            {/* Left half stays open for imagery the founder is supplying. */}
            <div aria-hidden className="hidden lg:block" />
            <div>
              <h2
                id="convictions-title"
                className="text-[clamp(1.75rem,3.4vw,3rem)] leading-tight font-extrabold"
              >
                What we hold to
              </h2>
              <ul className="mt-8 space-y-5">
                {CONVICTIONS.map((c) => (
                  <li key={c} className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-white text-brand"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[clamp(1rem,1.5vw,1.25rem)] leading-snug">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How we work */}
        <section aria-labelledby="how-title" className="mx-auto max-w-[1370px] px-6 py-16 lg:py-24">
          <Reveal>
            <h2
              id="how-title"
              className="text-[clamp(1.875rem,3.6vw,3rem)] font-extrabold tracking-tight"
            >
              How we work
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {HOW_WE_WORK.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <article className="h-full rounded-[22px] bg-cream px-7 py-8">
                  <h3 className="text-[clamp(1.125rem,2vw,1.625rem)] font-bold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-body-mute">
                    {item.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <ProveItBand />

        {/* Custom plan CTA */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-16">
          <div className="flex flex-col items-center justify-between gap-6 rounded-[22px] bg-peach/60 px-8 py-8 sm:flex-row">
            <p className="text-[clamp(1.125rem,2vw,1.625rem)] font-extrabold">
              Not sure which plan fits your catalogue?
            </p>
            <Link
              href="/pricing"
              className="cta-primary"
            >
              Get my custom plan
              <Arrow className="size-5" />
            </Link>
          </div>
        </Reveal>

        {/* Updates */}
        <section aria-labelledby="updates-title" className="mx-auto max-w-[1370px] px-6 pb-16">
          <Reveal>
            <h2
              id="updates-title"
              className="text-[clamp(1.875rem,3.6vw,3rem)] font-extrabold tracking-tight"
            >
              From the build log
            </h2>
            <p className="mt-3 max-w-[60ch] text-[17px] text-body-mute">
              Company updates and engineering notes &mdash; not customer stories.
              We&rsquo;ll publish those when there are customers to quote.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {UPDATES.map((post, i) => (
              <Reveal key={post.title} delay={i * 90}>
                <article className="flex h-full flex-col rounded-[22px] bg-white p-7 ring-1 ring-line transition-transform duration-300 hover-lift [--lift:4px]">
                  <span className="w-fit rounded-full bg-peach px-3.5 py-1 text-[11.5px] font-extrabold tracking-[0.12em] text-brand uppercase">
                    {post.tag}
                  </span>
                  <h3 className="mt-4 text-[clamp(1.0625rem,1.7vw,1.375rem)] leading-snug font-bold">
                    {post.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-body-mute">
                    {post.dek}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-bold text-brand">
                    Coming soon
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Faq items={ABOUT_FAQ} />
      </main>
      <Footer />
    </>
  );
}
