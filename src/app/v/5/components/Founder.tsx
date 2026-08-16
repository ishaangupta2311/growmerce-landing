import Image from "next/image";
import Reveal from "@/components/site/Reveal";
import styles from "../bazaar.module.css";
import {
  Barcode,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  Sparkle,
  Stamp,
  Sticker,
} from "./bits";

const COUNTER_NOTES = [
  "Demos are run by the person who writes the code.",
  "Based in Delhi, serving stores worldwide.",
  "If a tool isn’t right for your store yet, you’ll be told so.",
];

function Tick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 13.5 9.5 19 20 5" />
    </svg>
  );
}

function Scissors({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="6" cy="18" r="2.6" />
      <path d="M8 7.6 20 18M8 16.4 20 6" />
    </svg>
  );
}

export default function Founder() {
  return (
    <section
      id="founder"
      aria-labelledby="founder-title"
      className="relative px-5 pt-20 pb-24 sm:px-8 lg:pt-24 lg:pb-28"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-center gap-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <Reveal>
            <div>
              <SectionHeading
                eyebrow="Packed by hand"
                eyebrowTone="butter"
                title={<span id="founder-title">Meet the packer.</span>}
                lead="Growmerce is founder-led and built in public. The person who answers your questions is the person shipping the thing you are asking about."
              />

              <ul className="mt-8 space-y-4">
                {COUNTER_NOTES.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-3.5 text-[15.5px] leading-relaxed text-[#3d2a20]"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border-2 border-[#2b1c14] bg-[#ffd66e] text-[#2b1c14]"
                    >
                      <Tick className="size-3.5" />
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* An opened carton with the thank-you card lifted out of it. */}
          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-[540px] pt-16">
              {/* Flaps, folded open. */}
              <div
                aria-hidden
                className={`${styles.flute} absolute top-4 left-3 h-20 w-1/2 origin-bottom-left -rotate-[7deg] border-[3px] border-[#2b1c14]`}
              />
              <div
                aria-hidden
                className={`${styles.flute} absolute top-4 right-3 h-20 w-1/2 origin-bottom-right rotate-[7deg] border-[3px] border-[#2b1c14]`}
              />

              {/* The carton. */}
              <div
                className={`${styles.kraft} relative rounded-[8px] border-[3px] border-[#2b1c14] px-4 pt-20 pb-6 shadow-[var(--soft-3)] sm:px-6`}
              >
                <div
                  aria-hidden
                  className="absolute inset-x-4 top-4 h-24 rounded-[6px] bg-[linear-gradient(180deg,rgba(66,36,12,0.45),rgba(66,36,12,0.05))]"
                />

                {/* The card. */}
                <div
                  className={`${styles.grain} relative -mt-8 rotate-[-1.6deg] border-[3px] border-[#2b1c14] bg-[#fffaf5] px-6 py-7 shadow-[var(--soft-2)] sm:px-8 sm:py-8`}
                >
                  <div className="relative z-[2]">
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden
                        className={`${styles.poster} grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-[#2b1c14] bg-[#ffe8df] text-[24px] text-[#d1400a]`}
                      >
                        G
                      </span>
                      <div>
                        <p
                          className={`${styles.display} text-[19px] leading-tight font-extrabold`}
                        >
                          The founder
                        </p>
                        <p
                          className={`${styles.mono} text-[12px] font-bold tracking-[0.14em] text-[#5a4034] uppercase`}
                        >
                          Growmerce · Delhi, India
                        </p>
                      </div>
                    </div>

                    <p
                      className={`${styles.hand} mt-6 text-[27px] leading-none text-[#d1400a]`}
                    >
                      Thanks for opening the box.
                    </p>

                    <p className="mt-4 text-[15.5px] leading-relaxed text-[#3d2a20]">
                      I started Growmerce because I kept meeting store owners
                      who were told AI was now essential, quoted a platform
                      migration, and left to work out the rest alone. So we
                      build small, sharp tools instead — sold to real stores
                      from day one, kept only if they keep earning their place.
                    </p>
                    <p className="mt-3.5 text-[15.5px] leading-relaxed text-[#3d2a20]">
                      Book a demo and you get me: the roadmap, the honest
                      version of what works today, and a straight answer on
                      whether Growsearch fits your catalogue yet.
                    </p>

                    <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
                      <p
                        className={`${styles.hand} text-[28px] leading-none text-[#2b1c14]`}
                      >
                        — the packer
                      </p>
                      <Stamp tone="orange" rot={-7}>
                        Packed by the founder · Delhi
                      </Stamp>
                    </div>
                  </div>
                </div>

                {/* A seal sticker holding the card to the box. */}
                <div className="absolute -right-3 bottom-10 z-[3] sm:-right-5">
                  <Sticker
                    rot={5}
                    className="rounded-full bg-[#d1400a] px-3 py-3 text-center"
                  >
                    <Sparkle
                      className={`${styles.twinkle} size-5 text-white`}
                    />
                  </Sticker>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ------------------------------------------------------------------
            Final call to action — tear along the dotted line.
        ------------------------------------------------------------------ */}
        <Reveal delay={100}>
          <div
            id="early-access"
            className={`${styles.grain} relative mt-20 scroll-mt-28 overflow-hidden rounded-[22px] border-[3px] border-[#2b1c14] bg-[#d1400a] px-6 pt-6 pb-12 text-white shadow-[var(--soft-3)] sm:px-12 sm:pb-14 lg:mt-28`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-28 -right-12 size-80 rounded-full bg-[radial-gradient(circle,rgba(255,205,150,0.35),transparent_66%)]"
            />

            {/* The perforation. */}
            <div className="relative z-[2] flex items-center gap-4">
              <Scissors className="size-5 shrink-0 -scale-x-100" />
              <span
                className={`${styles.mono} shrink-0 text-[11px] font-bold tracking-[0.28em] uppercase`}
              >
                Tear here to open
              </span>
              <span
                aria-hidden
                className="h-0 grow border-t-[3px] border-dashed border-white/70"
              />
            </div>

            <div className="relative z-[2] mt-10 flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2
                  className={`${styles.poster} text-[clamp(2.4rem,6vw,4rem)] text-balance`}
                >
                  Come in — we&rsquo;re open.
                </h2>
                <p className="mt-5 text-[17px] leading-relaxed text-white">
                  Get early access to Growsearch, or book a demo with the
                  founder. It really is the founder — there is no sales team to
                  hand you off to.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <PrimaryButton
                    href="#"
                    size="lg"
                    className="!bg-[#fffaf5] !text-[#2b1c14]"
                  >
                    Get early access
                  </PrimaryButton>
                  <SecondaryButton
                    href="#"
                    size="lg"
                    className="!border-[#fffaf5] !bg-transparent !text-white hover:!bg-white/15 hover:!text-white"
                  >
                    Book a founder demo
                  </SecondaryButton>
                </div>

                <p
                  className={`${styles.mono} mt-8 inline-flex items-center gap-2.5 border-2 border-[#2b1c14] bg-[#fffaf5] px-3.5 py-2 text-[11.5px] font-bold tracking-[0.1em] text-[#2b1c14] uppercase`}
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full bg-[#2f9e74] ring-[3px] ring-[#93d3b8]/50"
                  />
                  Growsearch is launching now on the Shopify App Store
                </p>
              </div>

              <div className="relative w-full max-w-[250px] self-center lg:self-auto">
                <Image
                  src="/img/hero-cart.png"
                  alt=""
                  width={474}
                  height={468}
                  sizes="250px"
                  className={`${styles.drift} h-auto w-full drop-shadow-[0_26px_28px_rgba(90,26,0,0.5)]`}
                />
                <div className="mt-4 flex flex-col items-center">
                  <Barcode
                    seed="early-access-05"
                    bars={30}
                    color="#fffaf5"
                    className="h-9 w-[160px]"
                  />
                  <p
                    className={`${styles.mono} mt-1.5 text-[9.5px] font-bold tracking-[0.28em] text-white/85`}
                  >
                    GRW·EARLY·ACCESS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
