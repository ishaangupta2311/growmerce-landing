import Reveal from "@/components/site/Reveal";
import styles from "../bazaar.module.css";
import { SectionHeading, Stamp, Tape } from "./bits";

/* Published, attributed numbers from other vendors in the category. Nothing
   here is a Growmerce result and the labels say so, twice. */
const LABELS = [
  {
    stat: "10–30%",
    label: "lift in conversion rate",
    source: "Rep AI",
    detail:
      "Reported range for AI shopping assistants deployed on ecommerce storefronts.",
    ground: "bg-[#ffd66e]",
    rot: -2,
  },
  {
    stat: "6×",
    label: "conversion for assisted shoppers",
    source: "iAdvize × Kendra Scott",
    detail:
      "Shoppers who engaged with conversational assistance versus those who did not.",
    ground: "bg-[#8ed4e6]",
    rot: 1.6,
  },
  {
    stat: "+9% / +20%",
    label: "conversion rate / average order value",
    source: "Bloomreach Loomi",
    detail: "Reported by early-access customers of its AI merchandising suite.",
    ground: "bg-[#ffd7c5]",
    rot: -1.2,
  },
];

function CornerDots() {
  return (
    <>
      {[
        "top-1.5 left-1.5",
        "top-1.5 right-1.5",
        "bottom-1.5 left-1.5",
        "bottom-1.5 right-1.5",
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute ${pos} size-2 rotate-45 bg-[#2b1c14]`}
        />
      ))}
    </>
  );
}

export default function CrateLabels() {
  return (
    <section
      aria-labelledby="labels-title"
      className="relative px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Certified by other people"
            eyebrowTone="peach"
            title={
              <span id="labels-title">
                Other people&rsquo;s numbers, honestly labelled.
              </span>
            }
            lead="The category has enough published proof to make the case for AI in a storefront. We print it on the crate because it is the reason we are building — not because it is ours."
          />
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          {LABELS.map((c, i) => (
            <Reveal key={c.source} delay={i * 110}>
              <article
                className={`${styles.paper} ${styles.grain} relative h-full border-[4px] border-[#2b1c14] ${c.ground} p-2.5 shadow-[7px_9px_0_rgba(96,44,14,0.26)]`}
                style={{ "--rot": `${c.rot}deg` } as React.CSSProperties}
              >
                <CornerDots />

                <div className="relative z-[2] flex h-full flex-col border-2 border-[#2b1c14] px-4 py-5 text-center sm:px-5">
                  <p
                    className={`${styles.mono} text-[10.5px] font-bold tracking-[0.24em] text-[#2b1c14] uppercase`}
                  >
                    Category benchmark
                  </p>

                  {/* The arched device every crate label has. */}
                  <div
                    className={`${styles.arch} mt-3 border-[3px] border-[#2b1c14] bg-[#fffaf5] px-3 pt-6 pb-4`}
                  >
                    <p
                      className={`${styles.poster} text-[clamp(1.9rem,4vw,2.5rem)] text-[#d1400a]`}
                    >
                      {c.stat}
                    </p>
                    <p
                      className={`${styles.display} mt-1.5 text-[14.5px] leading-snug font-extrabold text-[#2b1c14]`}
                    >
                      {c.label}
                    </p>
                  </div>

                  <p className="mt-4 grow text-[13.5px] leading-relaxed text-[#432c20]">
                    {c.detail}
                  </p>

                  <div className="mt-5 flex justify-center">
                    <Stamp tone="ink" rot={i % 2 === 0 ? -6 : 5}>
                      Source: {c.source}
                    </Stamp>
                  </div>

                  <p
                    className={`${styles.mono} mt-4 border-t-2 border-dashed border-[#2b1c14]/40 pt-2.5 text-[10.5px] leading-snug font-bold text-[#5a4034] uppercase`}
                  >
                    Category benchmark · not a Growmerce result
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* The honesty note, taped to the front of the crate. */}
        <Reveal delay={200}>
          <div className="mt-12 flex flex-col items-center gap-8">
            <div className="relative max-w-lg rotate-[-1.4deg] border-[3px] border-[#2b1c14] bg-[#ffd66e] px-7 py-6 shadow-[6px_8px_0_rgba(96,44,14,0.28)]">
              <Tape className="absolute -top-4 left-1/2 z-[3] h-8 w-24 -translate-x-1/2 rotate-[2.5deg]" />
              <p
                className={`${styles.hand} text-center text-[24px] leading-tight text-[#2b1c14]`}
              >
                These are category benchmarks, not our results. Ours go on this
                crate the moment we can prove them.
              </p>
            </div>

            <Stamp tone="orange" rot={-6} size="lg">
              Not our results — yet
            </Stamp>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
