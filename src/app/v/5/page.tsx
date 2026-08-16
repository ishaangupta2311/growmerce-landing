import { TapeRibbon } from "./components/bits";
import CrateLabels from "./components/CrateLabels";
import Footer from "./components/Footer";
import Founder from "./components/Founder";
import Hero from "./components/Hero";
import Nav from "./components/Nav";
import PackingSlip from "./components/PackingSlip";
import Shelf from "./components/Shelf";
import WhyBox from "./components/WhyBox";

/* The ribbons are the seams of the page: strips of printed tape running the
   full width, holding one section to the next. Everything on them is said in
   full somewhere in the copy, so they are decorative. */
const PROMISES = [
  "Sell proof · not platform",
  "Ships today",
  "No migration",
  "Built in Delhi",
  "Install this afternoon",
];

const PRODUCT = [
  "Never zero results",
  "Search → checkout",
  "Founder-led",
  "Built in public",
  "One box at a time",
];

const AISLE = [
  "Aisle 01 · in stock",
  "Growsearch",
  "Storefront search that never dead-ends",
  "Now on the Shopify App Store",
];

const OPEN = [
  "Come in — we're open",
  "Get early access",
  "Book a founder demo",
  "The founder answers",
];

export default function StickerBazaarPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />

        {/* Two ribbons crossing — the loudest seam on the page. */}
        <div className="my-10 sm:my-14">
          <TapeRibbon items={PROMISES} tone="orange" angle={-2.6} />
          <div className="-mt-3">
            <TapeRibbon items={PRODUCT} tone="ink" angle={2.2} reverse />
          </div>
        </div>

        <WhyBox />

        <div className="my-12 sm:my-16">
          <TapeRibbon items={AISLE} tone="butter" angle={1.6} />
        </div>

        <Shelf />
        <PackingSlip />
        <CrateLabels />

        <div className="my-4 sm:my-8">
          <TapeRibbon items={OPEN} tone="sky" angle={-1.6} reverse />
        </div>

        <Founder />
      </main>
      <Footer />
    </>
  );
}
