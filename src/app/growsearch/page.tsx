import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PlatformStrip from "@/components/site/PlatformStrip";
import Faq from "@/components/site/Faq";
import SearchHero from "./components/SearchHero";
import WhyGrowsearch from "./components/WhyGrowsearch";
import FeatureStack from "./components/FeatureStack";
import InstallSteps from "./components/InstallSteps";
import TrialBand from "./components/TrialBand";
import PricingPreview from "./components/PricingPreview";
import { GROWSEARCH_FAQ } from "./faq-data";

export const metadata: Metadata = {
  title: "Growsearch — Storefront search that never dead-ends",
  description:
    "Growsearch understands what shoppers mean, recovers zero-result searches, and shows you exactly which searches turn into checkouts.",
};

export default function GrowsearchPage() {
  return (
    <>
      <Navbar />
      <main>
        <SearchHero />
        <PlatformStrip label="Works with" className="mt-16" />
        <WhyGrowsearch />
        <FeatureStack />
        <InstallSteps />
        <TrialBand />
        <PricingPreview />
        <Faq items={GROWSEARCH_FAQ} />
      </main>
      <Footer />
    </>
  );
}
