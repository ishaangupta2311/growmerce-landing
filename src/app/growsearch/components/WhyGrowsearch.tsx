import Image from "next/image";
import Reveal from "@/components/site/Reveal";

const CARDS = [
  {
    icon: "/img/icon-search-circle.svg",
    title: "Intent based search",
    body: "Natural language, vague queries, prices, discounts, and product attributes work automatically.",
  },
  {
    icon: "/img/icon-workflow.svg",
    title: "Zero-result recovery",
    body: "Fix typos, show alternatives, and never leave shoppers with an empty search page.",
  },
  {
    icon: "/img/icon-sparkle.svg",
    title: "Conversational shopping",
    body: "Refine results, switch products, and filter through a simple AI conversation.",
  },
  {
    icon: "/img/icon-growth-circle.svg",
    title: "Smart suggestion",
    body: "Track searches, clicks, cart adds, purchases, and AI-assisted conversions in real time.",
  },
];

export default function WhyGrowsearch() {
  return (
    <section className="bg-peach py-20 lg:py-24">
      <div className="mx-auto max-w-[1370px] px-6">
        <Reveal>
          <div className="flex items-center gap-3">
            <Image
              src="/img/icon-search-circle.svg"
              alt=""
              width={44}
              height={44}
              className="shrink-0"
            />
            <h2 className="text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold text-brand">
              Why Growsearch?
            </h2>
          </div>
          <p className="mt-4 text-[clamp(1.25rem,2vw,1.75rem)] font-semibold text-charcoal">
            Search that understands shoppers. Insights that grow revenue.
          </p>
          <p className="mt-3 max-w-[70ch] text-[17px] leading-relaxed text-body-mute">
            Growsearch uses AI to understand intent, recover lost searches,
            guide shoppers through conversations, and show merchants exactly
            how search drives sales.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 100}>
              <article className="h-full rounded-[24px] bg-white p-6 shadow-glow transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-glow-lg">
                <div className="flex size-[54px] items-center justify-center rounded-full bg-brand/12">
                  <Image src={card.icon} alt="" width={28} height={28} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-charcoal">
                  {card.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-body-mute">
                  {card.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
