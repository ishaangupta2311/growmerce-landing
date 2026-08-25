import Image from "next/image";
import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";
import { PLATFORMS } from "./PlatformStrip";

const CHECKLIST = [
  "Understands natural language and intent.",
  "Matches products meaning, not keywords.",
  "Considers attributes, synonyms and context.",
  "Personalized ranking for every shopper.",
];

function CircleTick() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 2.75a9.25 9.25 0 1 0 9.25 9.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m8.5 11.5 3 3L21.25 4.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Growsearch() {
  return (
    <section id="products" className="mx-auto max-w-[1370px] px-6 pt-24">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_703px]">
        <Reveal>
          <span className="inline-flex rounded-full bg-brand px-8 py-1 text-2xl font-medium text-white">
            Solutions
          </span>
          <h2 className="mt-4 text-[clamp(2.5rem,4.5vw,4rem)] font-semibold">
            Growsearch
          </h2>
          <p className="mt-2 text-xl font-extrabold leading-tight">
            AI search that understands your customers,
            <br className="hidden sm:block" /> not just what they type.
          </p>
          <div className="draw-line mt-4 h-[3px] w-[98px] bg-brand" />

          <ul className="mt-10 space-y-6">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-center gap-4 text-[clamp(1.125rem,1.8vw,1.625rem)] font-light"
              >
                <CircleTick />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap items-center gap-5">
            <Link href="/growsearch" className="cta-primary">
              Explore Growsearch
              <Arrow className="cta-arrow" />
            </Link>
            <Link
              href="#demo"
              className="cta-secondary"
            >
              See demo
            </Link>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <Image
            src="/img/smart-search-mock.png"
            alt="Growsearch results page showing top TV matches, recommendations and click-through-rate analytics"
            width={1536}
            height={1024}
            sizes="(min-width: 1024px) 703px, 100vw"
            className="w-full rounded-[27px]"
          />
        </Reveal>
      </div>

      {/* Ecosystem strip */}
      <Reveal className="mt-20">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-brand" />
          <Image src="/img/icon-sparkle.svg" alt="" width={23} height={23} />
          <p className="text-center text-2xl font-bold">
            Explore our products in these ecosystem
          </p>
          <Image src="/img/icon-sparkle.svg" alt="" width={23} height={23} />
          <div className="h-px flex-1 bg-brand" />
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-10 lg:px-24">
        {PLATFORMS.map((p, i) => (
          <Reveal key={p.name} delay={i * 100}>
            <div className="grid h-[142px] place-items-center rounded-[26px] bg-white px-6 shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-transform duration-300 hover:-translate-y-1.5">
              <Image
                src={p.src}
                alt={p.name}
                width={p.w}
                height={p.h}
                className={`w-auto max-w-full object-contain ${p.cls}`}
              />
            </div>
          </Reveal>
        ))}
      </div>

      {/* One-platform banner */}
      <Reveal delay={100}>
        <div className="mt-16 flex flex-col items-center gap-6 rounded-[24px] border border-brand bg-peach px-8 py-6 sm:flex-row">
          <Image src="/img/icon-platform.svg" alt="" width={87} height={85} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[clamp(1.25rem,2vw,1.625rem)] font-extrabold">
              One platform. Many ways to grow.
            </p>
            <p className="mt-1 text-[clamp(1.125rem,2vw,1.625rem)] text-body-mute">
              Power your entire commerce journey with AI.
            </p>
          </div>
          <Link href="#demo" className="cta-primary">
            See demo
            <Arrow className="cta-arrow" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
