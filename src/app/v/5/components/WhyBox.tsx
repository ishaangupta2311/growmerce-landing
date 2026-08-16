import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import styles from "../bazaar.module.css";
import { DottedArrow, SectionHeading, Stamp, Tape } from "./bits";

const BEATS = [
  {
    n: "01",
    tone: "bg-[#ffd66e]",
    title: "AI turned into table stakes",
    body: "Shoppers now expect a store that understands a sentence, not a keyword. That expectation arrived faster than most catalogues could keep up with.",
  },
  {
    n: "02",
    tone: "bg-[#8ed4e6]",
    title: "Nobody staffed for it",
    body: "Indie and mid-market stores run lean. There is no ML engineer sitting between the founder, the catalogue and the customer inbox.",
  },
  {
    n: "03",
    tone: "bg-[#ffd7c5]",
    title: "And the tools don’t fit",
    body: "Narrow gadgets solve a sliver of the job. Heavy platforms want a migration, a contract and a quarter of your year before you see anything.",
  },
];

const TILTS = [-1.8, 1.4, -1];

export default function WhyBox() {
  return (
    <section
      id="why"
      aria-labelledby="why-title"
      className="relative px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-start gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="What's in the box"
              eyebrowTone="butter"
              title={
                <span id="why-title">
                  Store owners were left to work out AI on their own.
                </span>
              }
              lead="Growmerce is an umbrella brand for practical ecommerce AI: we own, operate and build the tools, and we sell proof rather than platform. Founder-led, built in public, one product on the shelf at a time."
            />
          </Reveal>

          {/* The shopper, taped into the box like a packing photo. */}
          <Reveal delay={120} className="lg:justify-self-end">
            <figure className="relative mx-auto w-full max-w-[420px] rotate-[-2deg]">
              <Tape className="absolute -top-4 left-8 z-10 h-8 w-24 -rotate-[7deg]" />
              <Tape className="absolute -top-4 right-8 z-10 h-8 w-24 rotate-[6deg]" />

              <div
                className={`${styles.grain} border-[3px] border-[#2b1c14] bg-[#fffaf5] p-3 pb-4 shadow-[7px_9px_0_rgba(96,44,14,0.26)]`}
              >
                <Image
                  src="/img/hero-shopper.jpg"
                  alt="A shopper walking home at dusk, bags in hand."
                  width={840}
                  height={640}
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="h-[240px] w-full border-2 border-[#2b1c14] object-cover sm:h-[280px]"
                />
                <figcaption
                  className={`${styles.hand} relative z-[2] mt-3 text-center text-[21px] leading-tight text-[#5a4034]`}
                >
                  the person on the other side of the search bar
                </figcaption>
              </div>
            </figure>
          </Reveal>
        </div>

        {/* Three problems, each on a shipping label stuck to a carton. */}
        <div className="mt-16 grid gap-9 md:grid-cols-3 lg:mt-20 lg:gap-12">
          {BEATS.map((beat, i) => (
            <Reveal key={beat.n} delay={i * 110}>
              <div className="relative h-full">
                <article
                  className={`${styles.kraft} h-full rounded-[16px] border-[3px] border-[#2b1c14] p-3 shadow-[var(--soft-2)]`}
                  style={{ transform: `rotate(${TILTS[i]}deg)` }}
                >
                  <div
                    className={`${styles.grain} flex h-full flex-col border-2 border-[#2b1c14] bg-[#fffaf5]`}
                  >
                    <div
                      className={`${beat.tone} flex items-center justify-between border-b-2 border-[#2b1c14] px-3 py-1.5`}
                    >
                      <span
                        className={`${styles.mono} text-[11px] font-bold tracking-[0.2em] uppercase`}
                      >
                        Problem {beat.n}
                      </span>
                      <span
                        aria-hidden
                        className={`${styles.mono} text-[11px] font-bold tracking-[0.14em] opacity-60`}
                      >
                        of 03
                      </span>
                    </div>

                    <div className="relative z-[2] flex flex-1 flex-col p-5 sm:p-6">
                      <h3
                        className={`${styles.display} text-[21px] leading-tight font-extrabold text-balance`}
                      >
                        {beat.title}
                      </h3>
                      <p className="mt-3 text-[15.5px] leading-relaxed text-[#5a4034]">
                        {beat.body}
                      </p>
                    </div>
                  </div>
                </article>

                {i < BEATS.length - 1 ? (
                  <DottedArrow className="absolute top-[46%] -right-10 hidden h-8 w-16 text-[#d1400a]/60 lg:block" />
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>

        {/* The answer, stencilled on the side of the crate. */}
        <Reveal delay={140}>
          <div
            className={`${styles.grain} relative mt-14 overflow-hidden rounded-[22px] border-[3px] border-[#2b1c14] bg-[#2b1c14] px-6 pt-9 pb-16 text-white sm:px-12 sm:py-11 sm:pb-20`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[radial-gradient(circle,rgba(255,92,26,0.6),transparent_65%)]"
            />

            <div className="relative z-[2] max-w-3xl">
              <p
                className={`${styles.display} text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.12] font-extrabold text-balance`}
              >
                So we build the middle — tools you install this afternoon and
                judge by the numbers this month.
              </p>
              <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/75">
                Workflow depth over feature breadth. Paying customers from day
                one. No migration, no six-week onboarding, no AI team required.
              </p>
            </div>

            {/* Hazard band along the bottom of the crate panel. */}
            <div
              aria-hidden
              className={`${styles.hazardInk} absolute inset-x-0 bottom-0 z-[2] h-7 border-t-[3px] border-[#ffd66e]/40`}
            />

            <div className="absolute right-5 bottom-10 z-[3] hidden sm:block">
              <Stamp tone="butter" rot={-7} onDark>
                Sell proof · not platform
              </Stamp>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
