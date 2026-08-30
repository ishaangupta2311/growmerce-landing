import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PlatformStrip from "@/components/site/PlatformStrip";
import CtaPair from "@/components/site/CtaPair";
import Faq from "@/components/site/Faq";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import PricingPlans from "@/components/site/PricingPlans";
import AllPlans from "./components/AllPlans";
import { GROWSEARCH_FEATURES } from "@/lib/site-urls";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Growsearch plans from $49/month, every one with a 15-day free trial. No revenue share, no seat minimums.",
};

const ENTERPRISE = [
  "Advanced & custom feature support",
  "Custom AI training",
  "Custom integration",
  "24x7 priority support",
  "Advanced analytics for improvement",
];

const PRICING_FAQ = [
  {
    q: "Is there really a free trial?",
    a: "Yes — 15 days on every plan, no credit card required. You install Growsearch, point it at your catalogue and watch what your own shoppers search for before you decide anything.",
  },
  {
    q: "What counts as a search?",
    a: "One shopper query against your storefront. Follow-up refinements in the same conversation — “only under $20”, “show me sunscreens instead” — are part of that session, not new searches, so a browsing shopper doesn't burn your allowance.",
  },
  {
    q: "What happens if I go over my plan's searches?",
    a: "Search keeps working — we never switch your storefront off mid-month. We'll flag that you're trending over and suggest the tier that fits; if it was a one-off spike, nothing changes.",
  },
  {
    q: "Monthly or yearly — what's the difference?",
    a: "Only the price. Yearly saves between 7% and 15% depending on the tier; the product is identical. Start monthly if you want to stay light on your feet.",
  },
  {
    q: "Can I cancel, and do you take a cut of revenue?",
    a: "Cancel any time from your dashboard, and no — there is no revenue share and no per-seat pricing. A flat monthly number you can predict, which is the whole point.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-16 pb-14 text-center lg:pt-24">
          <h1 className="hero-enter mx-auto max-w-[24ch] text-[clamp(2rem,5.4vw,5rem)] leading-[1.06] font-extrabold tracking-tight text-balance">
            Pricing that respects your pipeline goals and{" "}
            <span className="text-brand">your budget</span>
          </h1>
          <p
            className="hero-enter mx-auto mt-7 max-w-[62ch] text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-relaxed text-body-mute"
            style={{ animationDelay: "120ms" }}
          >
            One flat monthly number per store. Every plan carries the whole
            product &mdash; the assistant, the recovery, the analytics &mdash;
            and the tiers only change how much searching your shoppers do.
          </p>
          <CtaPair
            className="mt-10 justify-center"
            primaryHref="#plans"
            secondaryHref={GROWSEARCH_FEATURES}
            secondaryLabel="Compare with competitors"
          />
        </section>

        <PlatformStrip />

        <div id="plans" className="scroll-mt-28">
          <PricingPlans />
        </div>

        {/* Enterprise */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pt-16">
          <section
            aria-labelledby="enterprise-title"
            className="rounded-[26px] border border-brand bg-[#fff8f4] px-7 py-10 sm:px-12 sm:py-12"
          >
            <p className="inline-flex rounded-full bg-peach px-5 py-2 font-poppins text-[13px] font-extrabold tracking-[0.16em] text-charcoal uppercase">
              Enterprise
            </p>
            <h2
              id="enterprise-title"
              className="mt-6 text-[clamp(1.875rem,4vw,3.5rem)] leading-tight font-extrabold tracking-tight"
            >
              Custom pricing for{" "}
              <span className="text-brand">high-volume stores</span>
            </h2>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {ENTERPRISE.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-brand/45 text-brand"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[15px] leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              {/* Sits where the other tiers show their price, so it answers
                  how the number is arrived at. The heading above already says
                  it is custom; repeating that here said nothing twice. */}
              <div>
                <p className="text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold">
                  From 100,000 searches a month
                </p>
                <p className="mt-1 max-w-[44ch] text-[16px] text-body-mute">
                  Priced on your volume and catalogue &mdash; never per seat,
                  never a share of revenue.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="#demo"
                  className="cta-primary"
                >
                  Talk to sales
                  <Arrow className="size-5" />
                </Link>
                <Link
                  href="#demo"
                  className="cta-secondary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3.5 9.5h17M8 3.5V6M16 3.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  See demo
                </Link>
              </div>
            </div>
          </section>
        </Reveal>

        <AllPlans />

        <Faq items={PRICING_FAQ} />
      </main>
      <Footer />
    </>
  );
}
