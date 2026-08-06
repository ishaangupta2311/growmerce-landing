import ScrollDriver from "@/components/ScrollDriver";
import Footer from "@/components/layout/Footer";
import Nav from "@/components/layout/Nav";
import Scene from "@/components/scene/Scene";
import Hero from "@/components/sections/Hero";
import Outro from "@/components/sections/Outro";
import ProductSection from "@/components/sections/ProductSection";
import { PRODUCTS } from "@/lib/products";

export default function Home() {
  return (
    <>
      <ScrollDriver />

      {/* Page wash: warm paper white with a photographic vignette — the
          reference is a photographed desk scene, and a cool flat gradient was
          a large part of why the page read as a template. The blue tint fades
          in with `--digitize`, which ScrollDriver writes every frame, so the
          background transitions with the trolley. */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(120%_85%_at_50%_0%,#fbfaf8_0%,#f3f1ed_55%,#e8e5df_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(115%_115%_at_50%_45%,transparent_58%,rgba(62,52,40,0.08)_100%)]" />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(62%_52%_at_50%_42%,rgba(96,150,255,0.16),transparent_74%)]"
        style={{ opacity: "var(--digitize)" }}
      />

      <Scene />
      <Nav />

      <main className="relative">
        <Hero />
        {PRODUCTS.map((product) => (
          <ProductSection key={product.id} product={product} />
        ))}
        <Outro />
      </main>

      <Footer />
    </>
  );
}
