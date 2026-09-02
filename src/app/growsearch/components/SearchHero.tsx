import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import TryFreeButton from "@/components/site/TryFreeButton";
import SearchDemoCard from "./SearchDemoCard";
import { GROWSEARCH_DEMO } from "@/lib/site-urls";

export default function SearchHero() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-14 pb-20 lg:pt-20 lg:pb-28">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-10">
        <Reveal>
          <h1 className="text-[clamp(1.875rem,5vw,4.25rem)] leading-[1.08] font-bold text-charcoal">
            Storefront search that never dead-ends{" "}
            <span className="text-brand">
              and analytics that prove what search sells.
            </span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-body-mute">
            Growsearch replaces the search bar on your storefront with one
            that reads sentences, recovers dead ends, and reports exactly
            what it sold.
          </p>
          {/* The pair wraps on a phone; left-aligned at their own widths the
              two stacked buttons look like a mistake, so they take the column
              instead. Matches children, not anchors — the trial CTA is a
              button now that it opens the demo-store gate. */}
          <div className="mt-9 flex flex-wrap items-center gap-4 [&>*]:max-[430px]:w-full">
            <TryFreeButton className="cta-primary" source="growsearch-hero">
              Start free trial
              <Arrow className="cta-arrow" />
            </TryFreeButton>
            <Link
              href={GROWSEARCH_DEMO}
              className="cta-secondary"
            >
              See demo
            </Link>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <SearchDemoCard />
        </Reveal>
      </div>
    </section>
  );
}
