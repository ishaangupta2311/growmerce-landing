import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Faq from "@/components/site/Faq";
import SearchHero from "./components/SearchHero";
import { GROWSEARCH_HOME } from "@/lib/site-urls";
import WhyGrowsearch from "./components/WhyGrowsearch";
import LayerStack from "./components/LayerStack";
import FeatureStack from "./components/FeatureStack";
import InstallSteps from "./components/InstallSteps";
import TrialBand from "./components/TrialBand";
import PricingPlans from "@/components/site/PricingPlans";
import { GROWSEARCH_FAQ } from "./faq-data";

export const metadata: Metadata = {
  title: "Growsearch — Storefront search that never dead-ends",
  description:
    "Growsearch understands what shoppers mean, recovers zero-result searches, and shows you exactly which searches turn into checkouts.",
  alternates: { canonical: GROWSEARCH_HOME },
};

export default function GrowsearchPage() {
  return (
    <>
      <Navbar scope="growsearch" />
      <main className="font-bricolage">
        <SearchHero />
        <WhyGrowsearch />
        <LayerStack />
        <FeatureStack />
        <InstallSteps />
        <TrialBand />
        <div id="growsearch-plans" className="scroll-mt-28">
          <PricingPlans />
        </div>
        <Faq items={GROWSEARCH_FAQ} />
      </main>
      <Footer />
    </>
  );
}
