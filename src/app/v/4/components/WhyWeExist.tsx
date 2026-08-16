import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import styles from "../nightmarket.module.css";
import { BulbTag, DottedArrow, SectionHeading } from "./bits";

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

          {/* The shopper on the other side of the search bar, walking the same
              street a few hours earlier. */}
          <Reveal delay={120} className="lg:justify-self-end">
            <figure className="relative mx-auto max-w-[420px] rotate-[-1.6deg]">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle,rgba(255,150,70,0.22),transparent_70%)]"
              />
              <div
                className={`${styles.signFace} relative overflow-hidden rounded-[28px] p-3`}
              >
                <Image
                  src="/img/hero-shopper.jpg"
                  alt="A shopper walking home at dusk, bags in hand."
                  width={840}
                  height={640}
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="h-[260px] w-full rounded-[20px] object-cover brightness-[0.86] saturate-[1.05] sm:h-[300px]"
                />
                <div
                  aria-hidden
                  className={`${styles.glass} pointer-events-none absolute inset-3 rounded-[20px]`}
                />
              </div>
              <figcaption
                className={`${styles.hand} mt-3 text-center text-[21px] leading-tight text-[#bda28c]`}
              >
                the person on the other side of the search bar
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* Three beats, each in its own lit window, strung together. */}
        <div className="mt-16 grid gap-10 md:grid-cols-3 lg:mt-20 lg:gap-14">
          {BEATS.map((beat, i) => (
            <Reveal key={beat.n} delay={i * 110}>
              <div className="relative h-full">
                <div
                  className={`${styles.vitrine} flex h-full flex-col rounded-[26px] p-6 sm:p-7`}
                >
                  <BulbTag tone="amber" className="self-start">
                    {beat.n}
                  </BulbTag>
                  <h3
                    className={`${styles.display} mt-4 text-[22px] leading-tight font-bold text-[#fff2e4]`}
                  >
                    {beat.title}
                  </h3>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-[#e3cab4]">
                    {beat.body}
                  </p>
                </div>
                <div
                  aria-hidden
                  className="mx-3 h-[3px] rounded-b-[6px] bg-gradient-to-r from-transparent via-[#ffc46b]/45 to-transparent"
                />
                {i < BEATS.length - 1 ? (
                  <DottedArrow
                    className="absolute top-[46%] -right-12 hidden h-8 w-16 text-[#ffc46b]/60 lg:block"
                    variant="right"
                  />
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={140}>
          {/* The one blazing surface in the section: white on deep vermilion,
              which is the pairing that clears AA on orange. */}
          <div className="relative mt-14 overflow-hidden rounded-[32px] bg-[#d1400a] px-7 py-9 shadow-[0_0_80px_-24px_rgba(255,92,26,0.85)] sm:px-12 sm:py-11">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[radial-gradient(circle,rgba(255,214,170,0.42),transparent_65%)]"
            />
            <p
              className={`${styles.display} relative max-w-3xl text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.12] font-extrabold text-balance text-white`}
            >
              So we build the middle — tools you install this afternoon and
              judge by the numbers this month.
            </p>
            <p className="relative mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white">
              Workflow depth over feature breadth. Paying customers from day
              one. No migration, no six-week onboarding, no AI team required.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
