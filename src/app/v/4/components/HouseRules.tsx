import Reveal from "@/components/site/Reveal";
import styles from "../nightmarket.module.css";
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

/* The little gooseneck lamp clamped over each sign. */
function SignLamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 44" fill="none" aria-hidden className={className}>
      <path
        d="M48 44 V30 C48 14 34 8 18 8"
        stroke="#5b4028"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="18" cy="8" r="4.5" fill="#5b4028" />
      <g className={styles.lamphead}>
        <path d="M30 6 h36 l12 20 h-60 z" fill="#3a2a1d" />
        <path d="M17 26 h62 l-3 4 h-56 z" fill="#ffcf8a" />
        <ellipse cx="48" cy="31" rx="24" ry="4" fill="#ffdca8" opacity="0.8" />
      </g>
    </svg>
  );
}

export default function HouseRules() {
  return (
    <section
      id="house-rules"
      aria-labelledby="rules-title"
      className="relative border-y border-[#ffc46b]/10 bg-[#160e08]/70 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Reveal>
            <SectionHeading
              eyebrow="lit up down the street"
              title={<span id="rules-title">House rules</span>}
              lead="Five things we decided before we wrote any code, and check ourselves against every week. They hang over the door so we can’t quietly drop one."
            />
          </Reveal>

          <Reveal delay={100}>
            <p
              className={`${styles.hand} flex items-center gap-2 text-[22px] leading-tight text-[#ffc46b]`}
            >
              <Sparkle className={`${styles.twinkle} size-3.5`} />
              nudge a sign, it swings
            </p>
          </Reveal>
        </div>

        <div className="relative mt-20">
          {/* The rail all five hang from. */}
          <div
            aria-hidden
            className={`${styles.rail} absolute inset-x-0 -top-1 hidden h-[6px] rounded-full lg:block`}
          />

          <ul className="grid gap-x-5 gap-y-16 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-6">
            {RULES.map((item, i) => (
              <li
                key={item.rule}
                className={`h-full ${i === RULES.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <Reveal delay={i * 90} className="h-full">
                  <div
                    className={`${styles.hang} h-full`}
                    style={{ animationDelay: `${i * 0.8}s` }}
                  >
                    <div
                      aria-hidden
                      className="mx-auto flex w-[76%] justify-between"
                    >
                      <span
                        className={`${styles.strap} h-5 w-[3px] rounded-b-[2px]`}
                      />
                      <span
                        className={`${styles.strap} h-5 w-[3px] rounded-b-[2px]`}
                      />
                    </div>

                    <div
                      className={`${styles.signFace} relative flex h-full flex-col rounded-[20px] px-5 pt-10 pb-6`}
                    >
                      <SignLamp className="absolute -top-[26px] left-1/2 h-[44px] w-[96px] -translate-x-1/2" />
                      <span
                        aria-hidden
                        className={`${styles.breathe} pointer-events-none absolute -top-2 left-1/2 h-24 w-40 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_top,rgba(255,196,120,0.34),transparent_68%)] blur-[6px]`}
                      />

                      <span
                        className={`${styles.sign} ${styles.neonAmber} mx-auto flex size-8 items-center justify-center rounded-full bg-[#20140c] text-[16px] leading-none ring-1 ring-[#ffc46b]/40`}
                      >
                        {i + 1}
                      </span>

                      <h3
                        className={`${styles.display} mt-4 text-center text-[19px] leading-snug font-bold text-[#fff2e4]`}
                      >
                        {item.rule}
                      </h3>
                      <p className="mt-2.5 text-center text-[14.5px] leading-relaxed text-[#e3cab4]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
