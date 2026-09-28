import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import SearchHero from "./components/SearchHero";
import FeatureStack from "./components/FeatureStack";
import InstallAccordion from "./components/InstallAccordion";

export const metadata: Metadata = {
  title: "AI-powered product search",
  description:
    "AI search that understands what shoppers mean, never ends on “no results”, and puts an Add button on every result. Installs into your Shopify store in minutes.",
};

export default function AiSearchPage() {
  return (
    <>
      <Navbar />
      <main className="bg-cream font-bricolage">
        <SearchHero />
        <FeatureStack />
        <InstallAccordion />
      </main>
      <Footer />
    </>
  );
}
