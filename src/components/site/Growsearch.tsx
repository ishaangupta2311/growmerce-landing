import Image from "next/image";
import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";
import { PlatformLogos } from "./PlatformStrip";
import DemoShot from "./DemoShot";
import DemoStoreButton from "./DemoStoreButton";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

const CHECKLIST = [
  "Understands natural language and shopper intent, no keyword-matching required.",
  "Matches products by meaning, not just exact titles or tags.",
  "Corrects typos and reads synonyms, so no search comes back empty.",
  "Personalized ranking for every shopper.",
  "Discovery that converts shoppers.",
];

/* The same tick the growth cards use, so the two checklists on the page
   agree with each other. */
function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className}>
      <circle cx="10" cy="10" r="8.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m6.4 10.3 2.5 2.5 4.7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Growsearch() {
  return (
    <section id="products" className="mx-auto max-w-[1370px] px-6 pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,660px)] lg:gap-16">
        <Reveal>
          <p className="section-eyebrow">Solutions</p>
          <h2 className="section-title mt-4">Growsearch</h2>
          <p className="section-lede mt-4 max-w-[40ch]">
            AI search that understands your customers, not just what they type.
          </p>

          <ul className="mt-8 space-y-3.5">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[17px] leading-[1.5] text-charcoal"
              >
                <Check className="mt-[3px] size-5 shrink-0 text-brand" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4 [&>a]:max-[430px]:w-full sm:gap-5">
            <Link href={GROWSEARCH_HOME} className="cta-primary">
              Explore Growsearch
              <Arrow className="cta-arrow" />
            </Link>
            <DemoStoreButton className="cta-secondary" source="home-growsearch" />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <DemoShot
            src="/img/demos/linen-shirt.webp"
            alt="A shopper searches “linen shirt but not white” and Growsearch returns six linen shirts, none of them white"
            width={1387}
            height={1134}
            sizes="(min-width: 1024px) 660px, 100vw"
            className="w-full rounded-[20px]"
          />
        </Reveal>
      </div>

      {/* Ecosystems. The platform row is the one the strip under the hero
          uses, so the marks and their "coming soon" labels are drawn once. */}
      <Reveal className="mt-16 flex flex-col items-center gap-6 border-t border-peach pt-10 lg:flex-row lg:justify-center lg:gap-14">
        <p className="shrink-0 text-[13px] font-bold tracking-[0.16em] text-charcoal/55 uppercase">
          Explore our products in these ecosystems
        </p>
        <PlatformLogos />
      </Reveal>

      {/* One-platform banner */}
      <Reveal delay={100}>
        <div className="mt-10 flex flex-col items-start gap-5 rounded-[20px] border border-peach bg-cream px-6 py-6 sm:flex-row sm:items-center sm:px-8">
          <Image src="/img/icon-platform.svg" alt="" width={87} height={85} className="size-14 shrink-0" />
          <div className="flex-1">
            <p className="text-[clamp(1.125rem,1.5vw,1.375rem)] leading-snug font-semibold">
              One platform. Many ways to grow.
            </p>
            <p className="mt-1 text-[16px] leading-[1.5] text-body-mute">
              Power your entire commerce journey with AI.
            </p>
          </div>
          <DemoStoreButton className="cta-primary" source="home-platform-band">
            See demo
            <Arrow className="cta-arrow" />
          </DemoStoreButton>
        </div>
      </Reveal>
    </section>
  );
}
