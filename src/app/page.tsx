import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import PlatformStrip from "@/components/site/PlatformStrip";
import Fighting from "@/components/site/Fighting";
import Growsearch from "@/components/site/Growsearch";
import PricingBand from "@/components/site/PricingBand";
import AiSection from "@/components/site/AiSection";
import Faq, { HOME_FAQ } from "@/components/site/Faq";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Navbar homepage />
      <main className="font-bricolage">
        <Hero />
        <PlatformStrip />
        <Fighting />
        <Growsearch />
        <PricingBand />
        <AiSection />
        <Faq items={HOME_FAQ} />
      </main>
      <Footer />
    </>
  );
}
