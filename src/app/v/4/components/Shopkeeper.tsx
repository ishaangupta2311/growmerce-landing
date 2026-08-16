import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import styles from "../nightmarket.module.css";
import {
  AwningBand,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  Sparkle,
} from "./bits";
import { BulbFrame } from "./scenery";

const COUNTER_NOTES = [
  "Demos are run by the person who writes the code.",
  "Based in Delhi, serving stores worldwide.",
  "If a tool isn’t right for your store yet, you’ll be told so.",
];

/* A pot plant and a mug on the windowsill, silhouetted against the light. */
function SillThings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 54" fill="none" aria-hidden className={className}>
      <path
        d="M18 54 L14 30 h26 l-4 24 z"
        fill="#150d07"
      />
      <path
        d="M27 30 C27 18 18 14 12 10 C20 12 27 16 29 24 C31 14 38 8 47 6 C41 12 33 18 31 30 z"
        fill="#150d07"
      />
      <path
        d="M74 54 h24 a4 4 0 0 0 4-4 V34 H70 v16 a4 4 0 0 0 4 4 z"
        fill="#150d07"
      />
      <path
        d="M102 38 h6 a6 6 0 0 1 0 12 h-6"
        stroke="#150d07"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}

export default function Shopkeeper() {
  return (
    <section
      id="shopkeeper"
      aria-labelledby="shopkeeper-title"
      className="relative px-5 pt-20 pb-24 sm:px-8 lg:pt-28 lg:pb-32"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-center gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal>
            <div>
              <SectionHeading
                eyebrow="the last light on the street"
                title={<span id="shopkeeper-title">Meet the shopkeeper.</span>}
                lead="Growmerce is founder-led and built in public. That means the person who answers your questions is the person shipping the thing you are asking about — usually at this hour."
              />
              <ul className="mt-8 space-y-3.5">
                {COUNTER_NOTES.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-3 text-[15.5px] leading-relaxed text-[#e3cab4]"
                  >
                    <Sparkle className="mt-1 size-3.5 shrink-0 text-[#ffc46b]" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* The one window still lit above the shop. */}
          <Reveal delay={120}>
            <div className="relative mx-auto max-w-[540px]">
              {/* the dark windows either side of it */}
              <div
                aria-hidden
                className="mb-5 flex items-end justify-between gap-4 px-2 opacity-70"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="relative block h-16 flex-1 rounded-[5px] bg-[#3a2517] p-[3px]"
                  >
                    <span
                      className={`${styles.glass} relative block h-full w-full rounded-[3px] bg-[#140d07]`}
                    >
                      <span className="absolute inset-y-0 left-1/2 w-px bg-[#3a2517]" />
                      <span className="absolute inset-x-0 top-1/2 h-px bg-[#3a2517]" />
                    </span>
                    <span className="absolute -inset-x-1 -bottom-1 h-1 rounded-[2px] bg-[#4a2e19]" />
                  </span>
                ))}
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 -z-10 rounded-[80px] bg-[radial-gradient(circle,rgba(255,150,70,0.34),transparent_70%)]"
              />

              {/* casing */}
              <div className="relative rounded-[14px] bg-[linear-gradient(180deg,#6b4527,#472c18)] p-3 shadow-[0_40px_80px_-44px_rgba(0,0,0,0.95)] ring-1 ring-[#ffc46b]/25">
                {/* glass */}
                <div className="relative overflow-hidden rounded-[8px] bg-[radial-gradient(125%_95%_at_50%_-8%,#7d4e2b_0%,#573521_46%,#3a2413_100%)] px-6 pt-8 pb-24 sm:px-9 sm:pt-9">
                  {/* curtains */}
                  <span
                    aria-hidden
                    className="absolute -top-2 -left-3 h-36 w-24 rounded-br-[90px] bg-[linear-gradient(140deg,#a04a1c,#5c2a12_62%)] shadow-[6px_6px_18px_-8px_rgba(0,0,0,0.8)]"
                  />
                  <span
                    aria-hidden
                    className="absolute -top-2 -right-3 h-36 w-24 rounded-bl-[90px] bg-[linear-gradient(220deg,#a04a1c,#5c2a12_62%)] shadow-[-6px_6px_18px_-8px_rgba(0,0,0,0.8)]"
                  />

                  <div className="relative flex items-center gap-4">
                    <span
                      aria-hidden
                      className={`${styles.tubeAmber} grid size-14 shrink-0 place-items-center rounded-full bg-[#20140c]`}
                    >
                      <span
                        className={`${styles.display} text-[22px] font-extrabold text-[#ffc46b]`}
                      >
                        G
                      </span>
                    </span>
                    <div>
                      <p
                        className={`${styles.display} text-[19px] leading-tight font-extrabold text-[#fff2e4]`}
                      >
                        The founder
                      </p>
                      <p className="text-[13.5px] font-semibold tracking-wide text-[#d8bda6]">
                        Growmerce · Delhi, India
                      </p>
                    </div>
                  </div>

                  <div
                    aria-hidden
                    className="relative mt-6 h-px w-full bg-[#ffc46b]/20"
                  />

                  <p className="relative mt-6 text-[16px] leading-relaxed text-[#f3ddca]">
                    I started Growmerce because I kept meeting store owners who
                    were told AI was now essential, quoted a platform migration,
                    and left to work out the rest alone. So we build small,
                    sharp tools instead — sold to real stores from day one, kept
                    only if they keep earning their place.
                  </p>
                  <p className="relative mt-4 text-[16px] leading-relaxed text-[#f3ddca]">
                    Book a demo and you get me: the roadmap, the honest version
                    of what works today, and a straight answer on whether
                    Growsearch fits your catalogue yet.
                  </p>

                  <p
                    className={`${styles.hand} relative mt-7 text-[27px] leading-none text-[#ffc46b]`}
                  >
                    — the shopkeeper
                  </p>

                  <SillThings className="absolute right-4 bottom-0 h-[54px] w-[120px]" />
                  <div
                    aria-hidden
                    className={`${styles.glass} pointer-events-none absolute inset-0`}
                  />
                </div>

                {/* sill */}
                <div
                  aria-hidden
                  className="absolute -inset-x-3 -bottom-2 h-3 rounded-[3px] bg-[linear-gradient(180deg,#8a5a33,#3d2513)]"
                />
              </div>

              {/* light thrown down the wall below the window */}
              <div
                aria-hidden
                className={`${styles.spill} pointer-events-none absolute inset-x-[8%] top-full h-[90px]`}
              />

              <p
                className={`${styles.hand} mt-12 text-center text-[21px] leading-tight text-[#bda28c]`}
              >
                still up, still shipping — it&rsquo;s a founder-led shop
              </p>
            </div>
          </Reveal>
        </div>

        {/* The shop, at the end of the street, with its lights on. */}
        <Reveal delay={100}>
          <div id="early-access" className="relative mt-24 scroll-mt-28 lg:mt-32">
            <AwningBand tone="ink" className="h-11 rounded-t-[40px]" />
            {/* Deep vermilion rather than the brightest orange: white body copy
                needs the extra contrast to clear AA. */}
            <div className="relative overflow-hidden rounded-b-[40px] bg-[#d1400a] px-6 pt-14 pb-12 text-white shadow-[0_0_100px_-30px_rgba(255,92,26,0.95)] sm:px-12 sm:pt-16 sm:pb-14">
              <div aria-hidden className="absolute inset-6 hidden sm:block">
                <BulbFrame />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute -top-28 -right-12 size-80 rounded-full bg-[radial-gradient(circle,rgba(255,214,170,0.34),transparent_66%)]"
              />

              <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h2
                    className={`${styles.display} text-[clamp(2.1rem,4.6vw,3.3rem)] leading-[1.02] font-extrabold text-balance text-white`}
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
                      className="!bg-[#fff3e6] !text-[#20140c] !shadow-[0_16px_30px_-16px_rgba(0,0,0,0.75)] hover:!bg-white"
                    >
                      Get early access
                    </PrimaryButton>
                    <SecondaryButton
                      href="#"
                      size="lg"
                      className="!border-white/75 !bg-transparent !text-white !shadow-none hover:!bg-white/12"
                    >
                      View demo
                    </SecondaryButton>
                  </div>

                  <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#20140c] px-4 py-2 text-[13.5px] font-bold tracking-wide text-[#fff2e4]">
                    <span
                      aria-hidden
                      className={`${styles.breathe} size-2 rounded-full bg-[#93d3b8] shadow-[0_0_10px_rgba(147,211,184,0.9)] ring-4 ring-[#93d3b8]/25`}
                    />
                    Growsearch is launching now on the Shopify App Store
                  </p>
                </div>

                <div className="relative w-full max-w-[240px] self-center lg:self-auto">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(70,18,0,0.4),transparent_66%)]"
                  />
                  <Image
                    src="/img/hero-cart.png"
                    alt=""
                    width={474}
                    height={468}
                    sizes="240px"
                    className={`${styles.drift} relative h-auto w-full drop-shadow-[0_26px_28px_rgba(90,26,0,0.55)]`}
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
