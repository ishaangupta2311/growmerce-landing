import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PlatformStrip from "@/components/site/PlatformStrip";
import CtaPair from "@/components/site/CtaPair";
import Faq from "@/components/site/Faq";
import { PRICING_FAQ } from "@/lib/faqs";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import PricingPlans from "@/components/site/PricingPlans";
import AllPlans from "./components/AllPlans";
import DemoStoreButton from "@/components/site/DemoStoreButton";
import InstallOnShopify from "@/components/site/InstallOnShopify";
import { GROWSEARCH_FEATURES, SHOPIFY_LISTING_LIVE } from "@/lib/site-urls";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Growsearch plans from $49/month, every one with a 14-day free trial. No revenue share, no seat minimums.",
};

const ENTERPRISE = [
  "Advanced & custom feature support",
  "Custom AI training",
  "Custom integration",
  "24x7 priority support",
  "Advanced analytics for improvement",
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

        {/* Sits under the plans as the quiet alternative to picking one: the
            visitor who has already decided can skip the tiers and install.
            Bordered, because the loud action on this page is still the plan
            they choose above it. */}
        <div className="mx-auto mt-8 flex max-w-[1370px] flex-col items-center px-6">
          <InstallOnShopify className="max-[430px]:w-full" source="pricing" />
          {/* The caption has to match what the button actually does, so it
              turns over with the flag rather than promising a tab that only
              opens once the listing is live. */}
          <p className="mt-3 max-w-[38ch] text-center text-[14px] text-muted">
            {SHOPIFY_LISTING_LIVE
              ? "Opens the Shopify App Store in a new tab."
              : "The listing is in review — we'll send your install link the day it's live."}
          </p>
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
              <div className="flex flex-wrap items-center gap-4 [&>a]:max-[430px]:w-full">
                <Link
                  href="mailto:admin@growmerce.ai"
                  className="cta-primary"
                >
                  Talk to sales
                  <Arrow className="size-5" />
                </Link>
                {/* The calendar mark went with the old link: this opens a
                    storefront now, it does not book anything. */}
                <DemoStoreButton className="cta-secondary" source="pricing-enterprise" />
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
