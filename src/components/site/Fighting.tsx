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
            {/* Three columns give each title a line of its own and the size
                to carry it. Stacked in one column, a 36px word over a 66px
                mark spends most of the card on one word — so on a phone the
                mark and the title share a row and the type comes down. */}
            <article className="h-full rounded-[27px] bg-white p-6 shadow-glow transition-[transform,box-shadow] duration-300 hover-lift [--lift:6px] hover:shadow-glow-lg md:p-7">
              <div className="flex items-center gap-4 md:block">
                {card.bare ? (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-bright/30 md:size-[66px]">
                    <Image src={card.icon} alt="" width={41} height={41} className="size-7 md:size-[41px]" />
                  </div>
                ) : (
                  <Image src={card.icon} alt="" width={66} height={63} className="h-12 w-auto shrink-0 md:h-[63px]" />
                )}
                <h3 className="text-[26px] font-bold md:mt-5 md:text-4xl">{card.title}</h3>
              </div>
              <div className="draw-line mt-4 h-[3px] w-[73px] bg-brand md:mt-3" />
              <p className="mt-3 max-w-[347px] leading-[1.4] md:mt-4">{card.body}</p>
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
