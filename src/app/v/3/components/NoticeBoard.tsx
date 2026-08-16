import Reveal from "@/components/site/Reveal";
import styles from "../shopfront.module.css";
import { SectionHeading } from "./bits";

/* Published, attributed numbers from other vendors in the category. Nothing
   here is a Growmerce result and the board says so out loud. */
const CLIPPINGS = [
  {
    stat: "10–30%",
    label: "lift in conversion rate",
    source: "Rep AI",
    detail:
      "Reported range for AI shopping assistants deployed on ecommerce storefronts.",
    tilt: "-1.6deg",
  },
  {
    stat: "6×",
    label: "conversion for assisted shoppers",
    source: "iAdvize × Kendra Scott",
    detail:
      "Shoppers who engaged with conversational assistance versus those who did not.",
    tilt: "1.2deg",
  },
  {
    stat: "+9% / +20%",
    label: "conversion rate / average order value",
    source: "Bloomreach Loomi",
    detail: "Reported by early-access customers of its AI merchandising suite.",
    tilt: "-0.9deg",
  },
];

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
            eyebrow="the notice board"
            title={
              <span id="board-title">
                Other people&rsquo;s numbers, honestly labelled.
              </span>
            }
            lead="The category has enough published proof to make the case for AI in a storefront. We pin it up because it is the reason we are building — not because it is ours."
          />
        </Reveal>

        {/* The board frame itself is static — only the clippings pin up, so the
            stagger stays readable instead of fading inside another fade. */}
        <div className="mt-14 rounded-[38px] bg-gradient-to-b from-[#a8724a] to-[#7d5334] p-3 shadow-[0_36px_70px_-44px_rgba(96,44,14,0.9)] sm:p-4">
          <div
            className={`${styles.corkboard} relative rounded-[26px] px-5 py-10 sm:px-9 sm:py-12`}
          >
            <div className="grid gap-7 sm:gap-6 md:grid-cols-3">
              {CLIPPINGS.map((c, i) => (
                <Reveal key={c.source} delay={i * 110}>
                  <article
                    className={`${styles.pinned} relative h-full rounded-[20px] bg-[#ffffff] px-5 pt-8 pb-6 shadow-[0_20px_38px_-24px_rgba(96,44,14,0.95)]`}
                    style={{ "--tilt": c.tilt } as React.CSSProperties}
                  >
                    <span
                      aria-hidden
                      className={`${styles.pin} absolute -top-2.5 left-1/2 size-[18px] -translate-x-1/2 rounded-full`}
                    />
                    <p
                      className={`${styles.display} text-[clamp(2rem,4vw,2.6rem)] leading-none font-extrabold text-[#ff5a1f]`}
                    >
                      {c.stat}
                    </p>
                    <p
                      className={`${styles.display} mt-2 text-[15px] leading-snug font-bold`}
                    >
                      {c.label}
                    </p>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-[#4a4a4a]">
                      {c.detail}
                    </p>
                    <p className="mt-4 border-t border-dashed border-[#171717]/15 pt-3 text-[12px] font-bold tracking-[0.08em] text-[#8a8a8a] uppercase">
                      Source: {c.source}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>

            {/* The honesty note, on a butter sticky. */}
            <Reveal delay={220}>
              <div className="mt-9 flex justify-center">
                <div className="relative max-w-md rotate-[-1.4deg] rounded-[6px] bg-[#ffcf6b] px-6 py-5 shadow-[0_18px_32px_-22px_rgba(96,44,14,0.95)]">
                  <span
                    aria-hidden
                    className={`${styles.tape} absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[2deg] rounded-[2px] opacity-90`}
                  />
                  <p
                    className={`${styles.hand} text-center text-[23px] leading-tight text-[#171717]`}
                  >
                    These are category benchmarks, not our results. Ours go up
                    on this board the moment we can prove them.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
