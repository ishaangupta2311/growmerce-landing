import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Faq from "@/components/site/Faq";
import Reveal from "@/components/site/Reveal";
import FeaturesHero from "./components/FeaturesHero";
import FeatureRow from "./components/FeatureRow";
import ClosingCta from "./components/ClosingCta";
import { FEATURE_ROWS } from "./rows-data";
import { FEATURES_FAQ } from "./faq-data";

export const metadata: Metadata = {
  title: "Growsearch features — Everything your search bar should be doing",
  description:
    "Twenty things Growsearch does that default Shopify search doesn't. Ten your shoppers feel, ten you see.",
};

const FEEL_ROWS = FEATURE_ROWS.filter((r) => r.group === "feel");
const SEE_ROWS = FEATURE_ROWS.filter((r) => r.group === "see");

export default function GrowsearchFeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <FeaturesHero />

        <Reveal className="mx-auto mt-16 max-w-[1370px] px-6">
          <figure>
            <Image
              src="/img/pages/combines-it-all.png"
              alt="Growsearch combining search, filtering, recommendations and analytics into one storefront experience"
              width={800}
              height={450}
              className="h-auto w-full rounded-[27px] object-cover"
            />
          </figure>
        </Reveal>

        <section className="mx-auto max-w-[1370px] px-6 py-20">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-charcoal">
              What shoppers feel
            </h2>
            <p className="mt-2 max-w-[60ch] text-body-mute">
              The half of Growsearch that shows up directly in the storefront
              experience.
            </p>
          </Reveal>
          <div className="mt-4 divide-y divide-line">
            {FEEL_ROWS.map((row, i) => (
              <FeatureRow key={row.title} row={row} index={i} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1370px] px-6 pb-20">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-charcoal">
              What you see
            </h2>
            <p className="mt-2 max-w-[60ch] text-body-mute">
              The half of Growsearch that shows up in your merchant
              dashboard.
            </p>
          </Reveal>
          <div className="mt-4 divide-y divide-line">
            {SEE_ROWS.map((row, i) => (
              <FeatureRow key={row.title} row={row} index={FEEL_ROWS.length + i} />
            ))}
          </div>
        </section>

        <ClosingCta />
        <Faq items={FEATURES_FAQ} />
      </main>
      <Footer />
    </>
  );
}
