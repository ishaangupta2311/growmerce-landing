import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import HomeIntro from "@/components/site/HomeIntro";
import PlatformStrip from "@/components/site/PlatformStrip";
import Fighting from "@/components/site/Fighting";
import DidYouKnow from "@/components/site/DidYouKnow";
import Growsearch from "@/components/site/Growsearch";
import PricingBand from "@/components/site/PricingBand";
import AiSection from "@/components/site/AiSection";
import EveryStore from "@/components/site/EveryStore";
import SearchGrowth from "@/components/site/SearchGrowth";
import Faq from "@/components/site/Faq";
import HomeFinalCta from "@/components/site/HomeFinalCta";
import { HOME_FAQ } from "@/lib/faqs";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <main>
        <Hero />
        <HomeIntro />
        <PlatformStrip />
        <Fighting />
        <DidYouKnow />
        <Growsearch />
        <PricingBand />
        <AiSection />
        <EveryStore />
        <SearchGrowth />
        <Faq items={HOME_FAQ} />
        <HomeFinalCta />
      </main>
      <Footer />
    </div>
  );
}
