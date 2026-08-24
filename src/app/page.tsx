import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import PlatformStrip from "@/components/site/PlatformStrip";
import Fighting from "@/components/site/Fighting";
import SmartSearch from "@/components/site/SmartSearch";
import PricingBand from "@/components/site/PricingBand";
import AiSection from "@/components/site/AiSection";
import Faq, { HOME_FAQ } from "@/components/site/Faq";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PlatformStrip />
        <Fighting />
        <SmartSearch />
        <PricingBand />
        <AiSection />
        <Faq items={HOME_FAQ} />
      </main>
      <Footer />
    </>
  );
}
