import { AwningBand } from "./components/bits";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HighStreet from "./components/HighStreet";
import HouseRules from "./components/HouseRules";
import Nav from "./components/Nav";
import NoticeBoard from "./components/NoticeBoard";
import Shopkeeper from "./components/Shopkeeper";
import WhyWeExist from "./components/WhyWeExist";

export default function ShopfrontPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />

        {/* The awning runs the full width of the street, dividing the brand
            story from the shops themselves. */}
        <AwningBand className="mt-4 h-7 sm:mt-8 sm:h-9" />

        <WhyWeExist />
        <HighStreet />
        <HouseRules />
        <NoticeBoard />
        <Shopkeeper />
      </main>
      <Footer />
    </>
  );
}
