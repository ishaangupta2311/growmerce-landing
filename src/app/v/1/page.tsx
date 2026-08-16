import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Toc from "./components/Toc";
import Thesis from "./components/Thesis";
import ExhibitA from "./components/ExhibitA";
import Doctrine from "./components/Doctrine";
import Proof from "./components/Proof";
import Footer from "./components/Footer";

export default function LedgerPage() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Toc />
      <Thesis />
      <ExhibitA />
      <Doctrine />
      <Proof />
      <Footer />
    </main>
  );
}
