import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import styles from "../shopfront.module.css";
import {
  AwningBand,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  Sparkle,
} from "./bits";

const COUNTER_NOTES = [
  "Demos are run by the person who writes the code.",
  "Based in Delhi, serving stores worldwide.",
  "If a tool isn’t right for your store yet, you’ll be told so.",
];

export default function Shopkeeper() {
  return (
    <section
      id="shopkeeper"
      aria-labelledby="shopkeeper-title"
      className="relative px-5 pt-20 pb-24 sm:px-8 lg:pt-28 lg:pb-32"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal>
            <div>
              <SectionHeading
                eyebrow="behind the counter"
                title={
                  <span id="shopkeeper-title">Meet the shopkeeper.</span>
                }
                lead="Growmerce is founder-led and built in public. That means the person who answers your questions is the person shipping the thing you are asking about."
              />
              <ul className="mt-8 space-y-3.5">
                {COUNTER_NOTES.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-3 text-[15.5px] leading-relaxed text-[#4a4a4a]"
                  >
                    <Sparkle className="mt-1 size-3.5 shrink-0 text-[#ff5a1f]" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* The note left on the counter. */}
          <Reveal delay={120}>
            <div className="relative mx-auto max-w-[540px] rotate-[1.1deg]">
              <span
                aria-hidden
                className={`${styles.tape} absolute -top-3.5 left-10 h-8 w-24 -rotate-[6deg] rounded-[3px]`}
              />
              <span
                aria-hidden
                className={`${styles.tape} absolute -top-3.5 right-10 h-8 w-24 rotate-[5deg] rounded-[3px]`}
              />

              <div className="rounded-[28px] bg-[#ffffff] px-7 py-8 shadow-[0_34px_64px_-38px_rgba(96,44,14,0.9)] ring-1 ring-[#171717]/8 sm:px-10 sm:py-10">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-[#171717] bg-[#ffe4d6]"
                  >
                    <span
                      className={`${styles.display} text-[22px] font-extrabold text-[#ff5a1f]`}
                    >
                      G
                    </span>
                  </span>
                  <div>
                    <p
                      className={`${styles.display} text-[19px] leading-tight font-extrabold`}
                    >
                      The founder
                    </p>
                    <p className="text-[13.5px] font-semibold tracking-wide text-[#8a8a8a]">
                      Growmerce · Delhi, India
                    </p>
                  </div>
                </div>

                <div
                  aria-hidden
                  className="mt-6 h-px w-full bg-[#171717]/10"
                />

                <p className="mt-6 text-[16px] leading-relaxed text-[#4a4a4a]">
                  I started Growmerce because I kept meeting store owners who
                  were told AI was now essential, quoted a platform migration,
                  and left to work out the rest alone. So we build small, sharp
                  tools instead — sold to real stores from day one, kept only if
                  they keep earning their place.
                </p>
                <p className="mt-4 text-[16px] leading-relaxed text-[#4a4a4a]">
                  Book a demo and you get me: the roadmap, the honest version of
                  what works today, and a straight answer on whether Growsearch
                  fits your catalogue yet.
                </p>

                <p
                  className={`${styles.hand} mt-7 text-[27px] leading-none text-[#ff5a1f]`}
                >
                  — the shopkeeper
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Final call to action. */}
        <Reveal delay={100}>
          <div id="early-access" className="relative mt-20 scroll-mt-28 lg:mt-28">
            <AwningBand className="h-11 rounded-t-[40px]" />
            {/* Deep vermilion rather than the brand's brightest orange: white
                body copy needs the extra contrast to clear AA. */}
            <div className="relative overflow-hidden rounded-b-[40px] bg-[#d1400a] px-6 pt-14 pb-12 text-white sm:px-12 sm:pt-16 sm:pb-14">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-28 -right-12 size-80 rounded-full bg-[radial-gradient(circle,rgba(255,190,140,0.3),transparent_66%)]"
              />

              <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h2
                    className={`${styles.display} text-[clamp(2.1rem,4.6vw,3.3rem)] leading-[1.02] font-extrabold text-balance`}
                  >
                    Come in — we&rsquo;re open.
                  </h2>
                  <p className="mt-5 text-[17px] leading-relaxed text-white">
                    Get early access to Growsearch, or book a demo with the
                    founder. It really is the founder — there is no sales team
                    to hand you off to.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <PrimaryButton
                      href="#"
                      size="lg"
                      className="!bg-[#ffffff] !text-[#171717] !shadow-[0_16px_30px_-16px_rgba(43,28,20,0.75)] hover:!bg-white"
                    >
                      Get early access
                    </PrimaryButton>
                    <SecondaryButton
                      href="#"
                      size="lg"
                      className="!border-white/70 !bg-transparent !text-white hover:!bg-white/12"
                    >
                      Book a founder demo
                    </SecondaryButton>
                  </div>

                  <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#ffffff] px-4 py-2 text-[13.5px] font-bold tracking-wide text-[#171717]">
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-[#93d3b8] ring-4 ring-[#93d3b8]/30"
                    />
                    Growsearch is launching now on the Shopify App Store
                  </p>
                </div>

                <div className="relative w-full max-w-[240px] self-center lg:self-auto">
                  <Image
                    src="/img/hero-cart.png"
                    alt=""
                    width={474}
                    height={468}
                    sizes="240px"
                    className={`${styles.drift} h-auto w-full drop-shadow-[0_26px_28px_rgba(120,40,4,0.45)]`}
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
