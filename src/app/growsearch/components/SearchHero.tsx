import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import DemoStoreButton from "@/components/site/DemoStoreButton";
import SearchDemoCard from "./SearchDemoCard";

export default function SearchHero() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-10 pb-20 sm:pt-14 lg:pt-20 lg:pb-28">
      <div className="grid items-center gap-12 sm:gap-14 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-10">
        <Reveal>
          {/* A phone gets the short form of each. In full they are eight lines
              of text before the first button, and the demo that makes the
              point starts below the fold. */}
          <h1 className="text-[clamp(1.875rem,5vw,4.25rem)] leading-[1.08] font-bold text-charcoal max-sm:text-balance">
            Storefront search that{" "}
            <span className="max-sm:text-brand">
              never <span className="max-sm:whitespace-nowrap">dead-ends</span>
            </span>
            <span className="sm:hidden">.</span>{" "}
            <span className="text-brand max-sm:hidden">
              and analytics that prove what search sells.
            </span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-body-mute sm:mt-6">
            <span className="sm:hidden">
              It reads sentences, recovers dead ends, and shows you what search
              sold.
            </span>
            <span className="max-sm:hidden">
              Growsearch replaces the search bar on your storefront with one
              that reads sentences, recovers dead ends, and reports exactly
              what it sold.
            </span>
          </p>
          {/* The pair wraps on a phone; left-aligned at their own widths the
              two stacked buttons look like a mistake, so they take the column
              instead. Matches children, not anchors — the trial CTA is a
              button now that it opens the demo-store gate. */}
          <div className="mt-7 flex flex-wrap sm:mt-9 items-center gap-4 [&>*]:max-[430px]:w-full">
            <Link href="/try" className="cta-primary">
              Start free trial
              <Arrow className="cta-arrow" />
            </Link>
            <DemoStoreButton className="cta-secondary" source="growsearch-hero" />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <SearchDemoCard />
        </Reveal>
      </div>
    </section>
  );
}
