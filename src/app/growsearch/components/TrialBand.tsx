import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";

export default function TrialBand() {
  return (
    <section id="trial" className="mx-auto max-w-[1370px] px-6 py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[40px] bg-brand px-8 py-16 text-center text-white sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-[-8%] size-[360px] rounded-full bg-white/10 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 left-[8%] size-[320px] rounded-full bg-white/10 blur-[100px]"
          />
          <h2 className="relative text-[clamp(2rem,4vw,3rem)] leading-[1.15] font-bold">
            Try Growsearch free for 15 days
          </h2>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#trial-form"
              className="block-cta bg-white text-brand"
            >
              Start free trial
              <Arrow className="cta-arrow" />
            </Link>
            <Link
              href="#demo"
              className="block-cta rounded-[10px] border-2 border-white text-white hover:bg-white hover:text-brand"
            >
              Book a demo
            </Link>
          </div>
          <p className="relative mt-6 text-sm text-white/80">
            15 days free trial. · No credit card required.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
