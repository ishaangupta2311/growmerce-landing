import Image from "next/image";
import Reveal from "./Reveal";

const CARDS = [
  {
    icon: "/img/icon-search-circle.svg",
    bare: false,
    title: "Category",
    body: "AI platforms promise to transform your business. What you get is a login screen, a signup form, and 'coming soon.'",
  },
  {
    icon: "/img/icon-workflow.svg",
    bare: true,
    title: "Operational",
    body: "The tools that actually work are good at just one thing. Almost nobody connects them to how ecommerce teams really work day to day.",
  },
  {
    icon: "/img/icon-wallet.svg",
    bare: true,
    title: "Economic",
    body: "Ecommerce brands and agencies are asked to do more with the same people, the same budget. Now, not someday.",
  },
];

export default function Fighting() {
  return (
    <section id="about" className="mx-auto max-w-[1370px] px-6 pt-24">
      <Reveal>
        <h2 className="text-[clamp(2.5rem,5.5vw,5rem)] font-bold leading-[1.2]">
          What are <span className="text-brand-bright">we fighting</span>?
        </h2>
        <p className="mt-4 max-w-[1197px] text-[clamp(1.25rem,2.2vw,2rem)] leading-[1.4]">
          Growmerce isn&apos;t fighting one product. It&apos;s fighting the way
          brands usually try to grow by hiring more, buying more tools, or just
          waiting.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {CARDS.map((card, i) => (
          <Reveal key={card.title} delay={i * 120}>
            <article className="h-full rounded-[27px] bg-white p-7 shadow-glow transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-glow-lg">
              {card.bare ? (
                <div className="flex size-[66px] items-center justify-center rounded-full bg-brand-bright/30">
                  <Image src={card.icon} alt="" width={41} height={41} />
                </div>
              ) : (
                <Image src={card.icon} alt="" width={66} height={63} />
              )}
              <h3 className="mt-5 text-4xl font-bold">{card.title}</h3>
              <div className="draw-line mt-3 h-[3px] w-[73px] bg-brand" />
              <p className="mt-4 max-w-[347px] leading-[1.4]">{card.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      {/* Proof banner */}
      <Reveal delay={100}>
        <div className="mt-14 flex flex-col items-center gap-8 rounded-[17px] bg-brand-bright/[0.14] px-8 py-8 sm:flex-row">
          <Image
            src="/img/icon-growth-circle.svg"
            alt=""
            width={154}
            height={150}
            className="size-[120px] shrink-0 lg:size-[150px]"
          />
          <div className="hidden h-[110px] w-px bg-body-mute/40 sm:block" />
          <div>
            <p className="text-[clamp(1.375rem,2.2vw,2rem)] font-bold">
              Growmerce doesn&apos;t sell a platform
            </p>
            <p className="mt-1 text-[clamp(1.5rem,2.6vw,2.375rem)] font-bold leading-[1.15]">
              It sells proof — shipped into your workflow,{" "}
              <span className="text-brand-bright">this week.</span>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
