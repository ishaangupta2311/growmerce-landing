import styles from "../ledger.module.css";
import Reveal from "@/components/site/Reveal";

export default function Thesis() {
  return (
    <section id="thesis" className="scroll-mt-20 border-b border-[var(--ink-15)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20 sm:px-10 sm:py-28">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
              § 01 · The thesis
            </p>
            <div className="draw-line h-px flex-1 bg-[var(--ink-15)]" />
          </div>
          <h2 className={`${styles.serif} mt-6 max-w-[24ch] text-[2rem] leading-[1.12] font-semibold sm:text-[2.6rem]`}>
            AI is becoming table stakes. Most operators are on their own.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-16">
          <Reveal delay={80}>
            <div className={`${styles.dropCap} max-w-[62ch] space-y-6 text-[17px] leading-[1.75] text-[var(--ink-70)] sm:text-lg`}>
              <p>
                Every storefront platform now ships an &ldquo;AI&rdquo;
                checkbox, and every vendor pitch leads with a model name. For
                a founder-led shop or a mid-market brand running lean, none
                of that changes the Tuesday-morning problem: there is no one
                on staff whose job is AI. No data scientist, no ML engineer,
                no time to evaluate a dozen vendors against a roadmap that
                doesn&rsquo;t exist yet.
              </p>
              <p>
                What&rsquo;s on offer tends to split two ways. Narrow gadgets — a
                chatbot widget, a single automation — that solve one small
                thing and leave the rest of the store untouched. Or heavy
                platforms that ask a team with no AI team to migrate their
                entire stack on a promise. Neither fits how most stores
                actually operate.
              </p>
              <p>
                Growmerce is built for the gap between those two. Tools you
                install into the store you already run, not a platform you
                migrate to — scoped narrow enough to ship fast, deep enough to
                do a real job, and proven with paying customers before we call
                them done.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160} className="lg:pt-2">
            <div className="border-t border-[var(--ink-15)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <p className={`${styles.serif} text-[1.35rem] leading-snug italic text-[var(--ink-85)]`}>
                &ldquo;We sell proof, not platform.&rdquo;
              </p>
              <p className="mt-4 text-[13px] leading-relaxed text-[var(--ink-40)]">
                Note — by &ldquo;AI team&rdquo; we mean staff dedicated to
                evaluating and building AI tooling: data scientists, ML
                engineers, in-house prompt work. Most SMB and mid-market
                operators run without one.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
