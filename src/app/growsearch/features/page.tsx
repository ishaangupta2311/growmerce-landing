import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Faq from "@/components/site/Faq";
import Reveal from "@/components/site/Reveal";
import FeaturesHero from "./components/FeaturesHero";
import { GROWSEARCH_FEATURES } from "@/lib/site-urls";
import CombinesItAll from "./components/CombinesItAll";
import FeatureReelGrid from "./components/FeatureReelGrid";
import ClosingCta from "./components/ClosingCta";
import { FEATURE_ROWS } from "./rows-data";
import { FEATURES_FAQ } from "./faq-data";

export const metadata: Metadata = {
  title: "Growsearch features — Everything your search bar should be doing",
  description:
    "Twenty things Growsearch does that default Shopify search doesn't. Ten your shoppers feel, ten you see.",
  alternates: { canonical: GROWSEARCH_FEATURES },
};

const FEEL_ROWS = FEATURE_ROWS.filter((r) => r.group === "feel");
const SEE_ROWS = FEATURE_ROWS.filter((r) => r.group === "see");

export default function GrowsearchFeaturesPage() {
  return (
    <>
      <Navbar scope="growsearch" />
      <main className="font-bricolage">
        <FeaturesHero />

        <CombinesItAll />

        <section className="mx-auto max-w-[1200px] px-6 py-20">
          <div aria-hidden className="mb-8 h-px bg-line" />
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-charcoal">
              What your shoppers get
            </h2>
            <p className="mt-2 max-w-[60ch] text-body-mute">
              They never see the technology. They just stop hitting dead ends.
            </p>
          </Reveal>
          <div className="mt-12">
            <FeatureReelGrid rows={FEEL_ROWS} />
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-20">
          <div aria-hidden className="mb-8 h-px bg-line" />
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-charcoal">
              What you see
            </h2>
            <p className="mt-2 max-w-[60ch] text-body-mute">
              The half of Growsearch that shows up in your merchant
              dashboard.
            </p>
          </Reveal>
          <div className="mt-12">
            <FeatureReelGrid rows={SEE_ROWS} />
          </div>
        </section>

        <ClosingCta />
        <Faq items={FEATURES_FAQ} />
      </main>
      <Footer />
    </>
  );
}
