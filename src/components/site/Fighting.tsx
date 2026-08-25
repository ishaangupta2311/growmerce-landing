import Image from "next/image";
import Reveal from "./Reveal";

const CARDS = [
  {
    icon: "/img/icon-search-circle.svg",
    bare: false,
    title: "Category",
    body: "Every AI platform promises the same thing. You get a login screen, a sign-up form, and \"coming soon.\"",
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
    body: "You're expected to do more with the same team and the same budget. This quarter, not next year.",
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
            <article className="h-full rounded-[27px] bg-white p-7 shadow-glow transition-[transform,box-shadow] duration-300 hover-lift [--lift:6px] hover:shadow-glow-lg">
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

      {/* Proof banner — a closing line on the three cards, not a second
          headline, so it sits a step below them in scale. */}
      <Reveal delay={100}>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-[18px] bg-brand-bright/[0.1] px-6 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-7">
          <Image
            src="/img/icon-growth-circle.svg"
            alt=""
            width={154}
            height={150}
            className="h-11 w-auto shrink-0"
          />
          <div className="hidden h-10 w-px bg-body-mute/25 sm:block" />
          <div>
            <p className="font-poppins text-[12px] font-semibold tracking-[0.14em] text-charcoal/55 uppercase">
              Growmerce doesn&apos;t sell a platform
            </p>
            <p className="mt-1 text-[clamp(1.0625rem,1.5vw,1.375rem)] leading-snug font-bold">
              It sells proof — shipped into your workflow,{" "}
              <span className="text-brand-bright">this week.</span>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
