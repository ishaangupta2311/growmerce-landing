import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import PlatformStrip from "@/components/site/PlatformStrip";
import Fighting from "@/components/site/Fighting";
import Growsearch from "@/components/site/Growsearch";
import PricingBand from "@/components/site/PricingBand";
import AiSection from "@/components/site/AiSection";
import EveryStore from "@/components/site/EveryStore";
import SearchGrowth from "@/components/site/SearchGrowth";
import Faq from "@/components/site/Faq";
import { HOME_FAQ } from "@/lib/faqs";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <Hero />
        <PlatformStrip />
        <Fighting />
        <Growsearch />
        <PricingBand />
        <AiSection />
        <EveryStore />
        <SearchGrowth />
        <Faq items={HOME_FAQ} />
      </main>
      <Footer />
    </>
  );
}
