import Reveal from "@/components/site/Reveal";
import CtaPair from "@/components/site/CtaPair";

export default function FeaturesHero() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-14 lg:pt-20">
      <Reveal>
        <p className="text-[13px] font-bold tracking-[0.24em] text-brand uppercase">
          Growsearch features
        </p>
        <h1 className="mt-4 max-w-[20ch] text-[clamp(1.875rem,5vw,4.25rem)] leading-[1.08] font-bold text-charcoal">
          Everything your search bar should have been doing
        </h1>
        <p className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-body-mute">
          Twenty things Growsearch does that default Shopify search
          doesn&apos;t. Ten of them your shoppers feel. Ten of them you see.
        </p>
        <CtaPair
          className="mt-9"
          primaryHref="/pricing"
          primaryLabel="GET STARTED"
          secondaryHref="/growsearch"
          secondaryLabel="SEE ALL OUR PRODUCTS"
        />
      </Reveal>
    </section>
  );
}
