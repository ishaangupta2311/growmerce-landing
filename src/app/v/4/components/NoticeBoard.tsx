import Reveal from "@/components/site/Reveal";
import styles from "../nightmarket.module.css";
import { SectionHeading } from "./bits";
import { BulbFrame } from "./scenery";

/* Published, attributed numbers from other vendors in the category. Nothing
   here is a Growmerce result and the board says so out loud, twice. */
const CLIPPINGS = [
  {
    stat: "10–30%",
    label: "lift in conversion rate",
    source: "Rep AI",
    detail:
      "Reported range for AI shopping assistants deployed on ecommerce storefronts.",
  },
  {
    stat: "6×",
    label: "conversion for assisted shoppers",
    source: "iAdvize × Kendra Scott",
    detail:
      "Shoppers who engaged with conversational assistance versus those who did not.",
  },
  {
    stat: "+9% / +20%",
    label: "conversion rate / average order value",
    source: "Bloomreach Loomi",
    detail: "Reported by early-access customers of its AI merchandising suite.",
  },
];

/* Each character slotted into the board as its own plastic tile, sitting very
   slightly crooked the way real ones do. The whole run is announced once as
   plain text so it is never spelled out letter by letter. */
const TILT = [-0.9, 0.7, -0.4, 1, -0.7, 0.4, -1, 0.6];

function Tiles({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex items-center gap-[3px]">
        {Array.from(text).map((ch, i) =>
          ch === " " ? (
            <span key={i} className="w-1.5" />
          ) : (
            <span
              key={i}
              className={`${styles.tile} ${styles.sign} inline-flex min-w-[19px] items-center justify-center rounded-[3px] px-[3px] py-1.5 text-[22px] leading-none text-[#fff2e4] sm:min-w-[26px] sm:px-1.5 sm:text-[30px]`}
              style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
            >
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

export default function NoticeBoard() {
  return (
    <section
      aria-labelledby="board-title"
      className="relative px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="now showing"
            title={
              <span id="board-title">
                Other people&rsquo;s numbers, honestly labelled.
              </span>
            }
            lead="The category has enough published proof to make the case for AI in a storefront. We put it up in lights because it is the reason we are building — not because it is ours."
          />
        </Reveal>

        <div className="relative mx-auto mt-16 max-w-[1000px]">
          {/* Brackets fixing the marquee to the wall. */}
          <div
            aria-hidden
            className="absolute -top-7 right-14 left-14 flex justify-between"
          >
            <span
              className={`${styles.strap} h-8 w-[4px] origin-bottom rotate-[16deg] rounded-full`}
            />
            <span
              className={`${styles.strap} h-8 w-[4px] origin-bottom -rotate-[16deg] rounded-full`}
            />
          </div>

          {/* The frame itself is static — only the listings light up, so the
              stagger stays readable instead of fading inside another fade. */}
          <div className="relative rounded-[26px] bg-[linear-gradient(180deg,#2a1a10,#180f08)] p-4 shadow-[0_40px_80px_-44px_rgba(0,0,0,0.95),0_0_70px_-24px_rgba(255,146,62,0.35)] ring-1 ring-[#ffc46b]/25 sm:p-6">
            <div className="relative overflow-hidden rounded-[16px]">
              <div className="bg-[#d1400a] py-2 text-center">
                <span
                  className={`${styles.sign} text-[19px] leading-none tracking-[0.34em] text-white`}
                >
                  Now showing
                </span>
              </div>

              <div className={`${styles.letterboard} px-4 py-5 sm:px-8 sm:py-7`}>
                {CLIPPINGS.map((c, i) => (
                  <Reveal key={c.source} delay={i * 110}>
                    <article
                      className={`grid gap-x-6 gap-y-2 py-5 md:grid-cols-[260px_1fr] md:items-baseline ${
                        i < CLIPPINGS.length - 1
                          ? "border-b border-dashed border-[#ffc46b]/18"
                          : ""
                      }`}
                    >
                      <Tiles text={c.stat} />
                      <div>
                        <h3
                          className={`${styles.sign} text-[21px] leading-tight tracking-[0.14em] text-[#fff2e4] sm:text-[24px]`}
                        >
                          {c.label}
                        </h3>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#bda28c]">
                          {c.detail}
                        </p>
                        <p className="mt-2 text-[12px] font-bold tracking-[0.1em] text-[#ffc46b] uppercase">
                          Source: {c.source}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Bulbs last, so they sit in the bezel in front of the board. */}
            <div aria-hidden className="absolute inset-2 sm:inset-3">
              <BulbFrame />
            </div>
          </div>

          {/* The honesty note, on a card clipped under the board. */}
          <Reveal delay={220}>
            <div className="mt-10 flex justify-center">
              <div
                className={`${styles.signFace} relative max-w-md rotate-[-1.2deg] rounded-[14px] px-6 py-5`}
              >
                <span
                  aria-hidden
                  className={`${styles.strap} absolute -top-3 left-1/2 h-6 w-[14px] -translate-x-1/2 rounded-[3px]`}
                />
                <p
                  className={`${styles.hand} text-center text-[23px] leading-tight text-[#ffc46b]`}
                >
                  These are category benchmarks, not our results. Ours go up on
                  this board the moment we can prove them.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
