import Image from "next/image";
import CtaPair from "@/components/site/CtaPair";

const STATS = [
  { value: "100%", label: "Natural-language search" },
  { value: "0", label: "Dead-end search experiences" },
  { value: "1 Click", label: "From search to cart" },
];

export default function SearchHero() {
  return (
    <section className="mx-auto grid max-w-[1370px] items-center gap-10 px-6 pt-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6 lg:pt-8 lg:pb-16">
      <div>
        <p className="hero-enter inline-flex rounded-[8px] bg-peach px-4 py-1 text-[clamp(1.125rem,1.8vw,1.75rem)] font-bold text-brand">
          AI Smart Search
        </p>
        <h1
          className="hero-enter mt-4 text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-charcoal"
          style={{ animationDelay: "90ms" }}
        >
          Turn every search into a <span className="text-brand">path to purchase.</span>
        </h1>
        <p
          className="hero-enter mt-5 max-w-[46ch] text-[clamp(1.0625rem,1.5vw,1.375rem)] leading-snug text-body-mute"
          style={{ animationDelay: "160ms" }}
        >
          Help shoppers find the right products faster with AI search that
          understands natural language, handles zero results, and enables
          direct add-to-cart.
        </p>

        <dl
          className="hero-enter mt-7 grid max-w-[560px] grid-cols-3 divide-x divide-line"
          style={{ animationDelay: "220ms" }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse pr-4 pl-4 first:pl-0">
              <dt className="mt-1 text-[clamp(0.875rem,1.2vw,1.125rem)] leading-tight text-charcoal">
                {stat.label}
              </dt>
              <dd className="text-[clamp(1.75rem,2.6vw,2.375rem)] leading-none font-extrabold tracking-tight text-brand">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <CtaPair
          className="hero-enter mt-8"
          primaryHref="/try"
          primaryLabel="Try now"
          secondaryHref="/solutions"
          secondaryLabel="See products"
        />
      </div>

      <div className="hero-enter mx-auto w-full max-w-[720px]" style={{ animationDelay: "140ms" }}>
        <Image
          src="/img/products/search-hero.webp"
          alt="Growmerce search on a laptop answering “summer dresses under $100” with four dresses, each with an Add to cart button"
          width={1239}
          height={1269}
          preload
          sizes="(min-width: 1024px) 720px, 100vw"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
