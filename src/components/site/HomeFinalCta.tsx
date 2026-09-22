import Arrow from "./Arrow";
import DemoStoreButton from "./DemoStoreButton";
import Reveal from "./Reveal";
import Link from "next/link";

export default function HomeFinalCta() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pb-20 pt-24 lg:pb-28">
      <Reveal className="relative overflow-hidden rounded-[28px] bg-brand px-6 py-12 text-white sm:px-12 sm:py-14 lg:px-16 lg:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 size-[360px] rounded-full bg-white/10 blur-[75px]" />
        <div className="relative max-w-[900px]">
          <h2 className="section-display max-w-[22ch]">
            Ready to stop losing shoppers to{" "}
            <span className="whitespace-nowrap">dead-end</span> searches?
          </h2>
          <p className="mt-5 max-w-[56ch] text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.55] text-white/85">
            Install Growsearch, point it at your live catalog, and watch what your shoppers actually ask for, free for 15 days, no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 [&>a]:max-[430px]:w-full [&>button]:max-[430px]:w-full">
            <DemoStoreButton className="cta-primary-inverse" source="home-final-cta">
              See demo
              <Arrow className="cta-arrow" />
            </DemoStoreButton>
            <Link href="/try" className="cta-secondary-inverse">
              Try it free
              <Arrow className="cta-arrow" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
