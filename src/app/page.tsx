import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import LogoBar from "@/components/site/LogoBar";
import Fighting from "@/components/site/Fighting";
import SmartSearch from "@/components/site/SmartSearch";
import PricingBand from "@/components/site/PricingBand";
import AiSection from "@/components/site/AiSection";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoBar />
        <Fighting />
        <SmartSearch />
        <PricingBand />
        <AiSection />
      </main>
      <Footer />
    </>
  );
}
