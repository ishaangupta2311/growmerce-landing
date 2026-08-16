import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import styles from "../shopfront.module.css";
import { DottedArrow, PriceTag, SectionHeading } from "./bits";

const BEATS = [
  {
    n: "01",
    title: "AI turned into table stakes",
    body: "Shoppers now expect a store that understands a sentence, not a keyword. That expectation arrived faster than most catalogues could keep up with.",
  },
  {
    n: "02",
    title: "Nobody staffed for it",
    body: "Indie and mid-market stores run lean. There is no ML engineer sitting between the founder, the catalogue and the customer inbox.",
  },
  {
    n: "03",
    title: "And the tools don’t fit",
    body: "Narrow gadgets solve a sliver of the job. Heavy platforms want a migration, a contract and a quarter of your year before you see anything.",
  },
];

export default function WhyWeExist() {
  return (
    <section
      id="why"
      aria-labelledby="why-title"
      className="relative px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="why we opened up shop"
              title={
                <span id="why-title">
                  Store owners were left to work out AI on their own.
                </span>
              }
              lead="Growmerce is an umbrella brand for practical ecommerce AI: we own, operate and build the tools, and we sell proof rather than platform. Founder-led, built in public, one shop at a time."
            />
          </Reveal>

          {/* Ambient photo — the shopper on the other side of the search bar. */}
          <Reveal delay={120} className="lg:justify-self-end">
            <figure className="relative mx-auto max-w-[420px] rotate-[-1.6deg]">
              <div
                aria-hidden
                className={`${styles.tape} absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-3deg] rounded-[3px]`}
              />
              <div className="overflow-hidden rounded-[28px] bg-[#fffaf6] p-3 shadow-[0_30px_60px_-34px_rgba(96,44,14,0.8)] ring-1 ring-[#2b1c14]/8">
                <Image
                  src="/img/hero-shopper.jpg"
                  alt="A shopper walking home at dusk, bags in hand."
                  width={840}
                  height={640}
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="h-[260px] w-full rounded-[20px] object-cover sm:h-[300px]"
                />
              </div>
              <figcaption
                className={`${styles.hand} mt-3 text-center text-[21px] leading-tight text-[#7a5a48]`}
              >
                the person on the other side of the search bar
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* Three beats on their own shelves, connected by dotted arrows. */}
        <div className="mt-16 grid gap-10 md:grid-cols-3 lg:mt-20 lg:gap-14">
          {BEATS.map((beat, i) => (
            <Reveal key={beat.n} delay={i * 110}>
              <div className="relative h-full">
                <div className="flex h-full flex-col rounded-[26px] bg-[#fffaf6] p-6 shadow-[0_20px_42px_-30px_rgba(96,44,14,0.9)] ring-1 ring-[#2b1c14]/8 sm:p-7">
                  <PriceTag tone="orange" className="self-start">
                    {beat.n}
                  </PriceTag>
                  <h3
                    className={`${styles.display} mt-4 text-[22px] leading-tight font-bold`}
                  >
                    {beat.title}
                  </h3>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-[#5a4034]">
                    {beat.body}
                  </p>
                </div>
                <div
                  aria-hidden
                  className={`${styles.shelf} mx-2 h-2.5 rounded-b-[8px]`}
                />
                {i < BEATS.length - 1 ? (
                  <DottedArrow
                    className="absolute top-[46%] -right-12 hidden h-8 w-16 text-[#eb5213]/55 lg:block"
                    variant="right"
                  />
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={140}>
          <div className="relative mt-14 overflow-hidden rounded-[32px] bg-[#2b1c14] px-7 py-9 text-white sm:px-12 sm:py-11">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[radial-gradient(circle,rgba(255,92,26,0.55),transparent_65%)]"
            />
            <p
              className={`${styles.display} relative max-w-3xl text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.12] font-extrabold text-balance`}
            >
              So we build the middle — tools you install this afternoon and
              judge by the numbers this month.
            </p>
            <p className="relative mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
              Workflow depth over feature breadth. Paying customers from day
              one. No migration, no six-week onboarding, no AI team required.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
