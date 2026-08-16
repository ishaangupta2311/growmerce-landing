import Reveal from "@/components/site/Reveal";
import styles from "../shopfront.module.css";
import { SectionHeading, Sparkle } from "./bits";

const RULES = [
  {
    rule: "Ship fast",
    body: "Small releases beat big roadmaps. If it can go out this week, it goes out this week.",
  },
  {
    rule: "Charge from day one",
    body: "A paying store owner is the only validation we trust. Free pilots tell you nothing.",
  },
  {
    rule: "Depth over breadth",
    body: "One workflow done properly, end to end — not forty features done to demo standard.",
  },
  {
    rule: "Install, don’t migrate",
    body: "Our tools fit the store you already run. No replatforming, no six-week onboarding.",
  },
  {
    rule: "Build in public",
    body: "Founder-led and openly worked on — the wrong turns included.",
  },
];

export default function HouseRules() {
  return (
    <section
      id="house-rules"
      aria-labelledby="rules-title"
      className="relative bg-[#ffe8df] px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal>
          <div>
            <SectionHeading
              eyebrow="pinned by the door"
              title={<span id="rules-title">House rules</span>}
              lead="Five things we decided before we wrote any code, and check ourselves against every week."
            />
            <p
              className={`${styles.hand} mt-8 flex items-center gap-2 text-[22px] leading-tight text-[#eb5213]`}
            >
              <Sparkle className={`${styles.twinkle} size-3.5`} />
              nudge the board, it swings
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mx-auto max-w-[640px] pt-8">
            {/* Rail and straps. */}
            <div
              aria-hidden
              className="mx-auto h-[7px] w-[92%] rounded-full bg-gradient-to-b from-[#c08a5e] to-[#8a5c3a] shadow-[0_4px_8px_-6px_rgba(96,44,14,0.9)]"
            />
            <div
              aria-hidden
              className="mx-auto mt-[-2px] flex w-[62%] justify-between"
            >
              <span className={`${styles.strap} h-6 w-[5px] rounded-b-[3px]`} />
              <span className={`${styles.strap} h-6 w-[5px] rounded-b-[3px]`} />
            </div>

            <div
              className={`${styles.swingOnHover} rounded-[30px] bg-gradient-to-b from-[#a8724a] to-[#7d5334] p-3 shadow-[0_34px_60px_-36px_rgba(96,44,14,0.95)]`}
            >
              <div
                className={`${styles.chalkboard} rounded-[22px] px-6 py-7 sm:px-9 sm:py-9`}
              >
                <p
                  className={`${styles.hand} text-center text-[30px] leading-none text-[#ffcf6b]`}
                >
                  How we run the place
                </p>
                <div
                  aria-hidden
                  className="mx-auto mt-3 h-px w-24 bg-white/25"
                />

                <ol className="mt-6 space-y-5">
                  {RULES.map((item, i) => (
                    <li key={item.rule} className="flex gap-4">
                      <span
                        className={`${styles.display} mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#ff5c1a] text-[13px] font-extrabold text-white`}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`${styles.display} block text-[18px] leading-snug font-bold text-[#fff4ec]`}
                        >
                          {item.rule}
                        </span>
                        <span className="mt-1 block text-[14.5px] leading-relaxed text-white/65">
                          {item.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
