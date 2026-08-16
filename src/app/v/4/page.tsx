import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HighStreet from "./components/HighStreet";
import HouseRules from "./components/HouseRules";
import Nav from "./components/Nav";
import NoticeBoard from "./components/NoticeBoard";
import Shopkeeper from "./components/Shopkeeper";
import WhyWeExist from "./components/WhyWeExist";

export default function NightMarketPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
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
