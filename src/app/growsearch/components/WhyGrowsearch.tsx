"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Reveal from "@/components/site/Reveal";

type Capability = {
  id: string;
  icon: string;
  title: string;
  body: string;
  mediaSrc: string | null;
  durationMs: number;
};

const CAPABILITIES: Capability[] = [
  {
    id: "intent-based-search",
    icon: "/img/icon-search-circle.svg",
    title: "Intent based search",
    body: "Natural language, vague queries, prices, discounts, and product attributes work automatically.",
    mediaSrc: null,
    durationMs: 5200,
  },
  {
    id: "zero-result-recovery",
    icon: "/img/icon-workflow.svg",
    title: "Zero-result recovery",
    body: "Fix typos, show alternatives, and never leave shoppers with an empty search page.",
    mediaSrc: null,
    durationMs: 5800,
  },
  {
    id: "conversational-shopping",
    icon: "/img/icon-sparkle.svg",
    title: "Conversational shopping",
    body: "Refine results, switch products, and filter through a simple AI conversation.",
    mediaSrc: null,
    durationMs: 5600,
  },
  {
    id: "smart-suggestion",
    icon: "/img/icon-growth-circle.svg",
    title: "Smart suggestion",
    body: "Track searches, clicks, cart adds, purchases, and AI-assisted conversions in real time.",
    mediaSrc: null,
    durationMs: 6200,
  },
];

const tabId = (id: string) => `growsearch-tab-${id}`;
const PANEL_ID = "growsearch-capability-panel";

export default function WhyGrowsearch() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerReset, setTimerReset] = useState(0);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [progressing, setProgressing] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeCapability = CAPABILITIES[activeIndex];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion !== false) return;

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % CAPABILITIES.length);
    }, activeCapability.durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeCapability.durationMs, activeIndex, reducedMotion, timerReset]);

  useEffect(() => {
    if (reducedMotion !== false) return;

    let startFrameId: number | undefined;
    const resetFrameId = window.requestAnimationFrame(() => {
      setProgressing(false);
      startFrameId = window.requestAnimationFrame(() => setProgressing(true));
    });

    return () => {
      window.cancelAnimationFrame(resetFrameId);
      if (startFrameId !== undefined) window.cancelAnimationFrame(startFrameId);
    };
  }, [activeIndex, reducedMotion, timerReset]);

  const selectCapability = (index: number) => {
    setActiveIndex(index);
    setTimerReset((current) => current + 1);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % CAPABILITIES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + CAPABILITIES.length) % CAPABILITIES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = CAPABILITIES.length - 1;
    }

    if (nextIndex === undefined) return;

    event.preventDefault();
    selectCapability(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="bg-peach py-20 lg:py-24">
      <div className="mx-auto max-w-[1370px] px-6">
        <Reveal>
          <div className="flex items-center justify-center gap-3 text-center">
            <Image
              src="/img/icon-search-circle.svg"
              alt=""
              width={44}
              height={44}
              className="shrink-0"
            />
            <h2 className="text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold text-brand">
              Why Growsearch?
            </h2>
          </div>
          <p className="mt-4 text-center text-[clamp(1.25rem,2vw,1.75rem)] font-semibold text-charcoal">
            Search that understands shoppers. Insights that grow revenue.
          </p>
          <p className="mx-auto mt-3 max-w-[70ch] text-center text-[17px] leading-relaxed text-body-mute">
            Growsearch uses AI to understand intent, recover lost searches,
            guide shoppers through conversations, and show merchants exactly
            how search drives sales.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <div>
            <div
              role="tablist"
              aria-label="Growsearch capabilities"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {CAPABILITIES.map((capability, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={capability.id}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    id={tabId(capability.id)}
                    aria-controls={PANEL_ID}
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => selectCapability(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    data-active={isActive}
                    className="group relative flex min-h-[116px] w-full items-start gap-3 rounded-[18px] border-2 border-brand/15 bg-white/45 px-4 py-4 text-left transition-[background-color,border-color,box-shadow] duration-300 hover:border-brand/45 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[active=true]:border-brand data-[active=true]:bg-white data-[active=true]:shadow-glow"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/12 transition-colors duration-300 group-data-[active=true]:bg-brand/18">
                      <Image src={capability.icon} alt="" width={24} height={24} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-tight text-charcoal">
                        {capability.title}
                      </span>
                      <span className="mt-2 block text-sm leading-snug text-body-mute">
                        {capability.body}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-auto mt-0.5 shrink-0 text-lg text-brand opacity-0 transition-opacity duration-300 group-data-[active=true]:opacity-100"
                    >
                      ↗
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              id={PANEL_ID}
              role="tabpanel"
              aria-labelledby={tabId(activeCapability.id)}
              tabIndex={0}
              className="relative isolate mt-8 min-h-[360px] overflow-hidden rounded-[28px] bg-charcoal p-6 text-white shadow-[0_24px_70px_-32px_rgba(23,23,23,0.75)] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:aspect-[16/9] sm:min-h-[440px] sm:p-8 xl:aspect-[2.4/1] xl:min-h-[460px]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 18% 20%, rgba(255,90,31,0.34), transparent 31%), linear-gradient(135deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(45deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "auto, 32px 32px, 32px 32px",
                }}
              />
              {activeCapability.mediaSrc ? (
                <Image
                  src={activeCapability.mediaSrc}
                  alt={`${activeCapability.title} preview`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[308px] flex-col justify-between sm:min-h-0">
                  <span className="inline-flex w-fit items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/65">
                    <span className="size-1.5 rounded-full bg-brand" />
                    GIF preview placeholder
                  </span>
                  <div>
                    <p className="max-w-[12ch] text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.05em] text-white">
                      {activeCapability.title}
                    </p>
                    <p className="mt-5 max-w-[35ch] text-sm leading-relaxed text-white/60">
                      A visual walkthrough for this capability will live here.
                    </p>
                  </div>
                </div>
              )}
              <div
                aria-hidden="true"
                className="absolute inset-x-6 bottom-6 h-1 overflow-hidden rounded-full bg-white/15 sm:inset-x-8 sm:bottom-8"
              >
                <span
                  className={`block h-full origin-left rounded-full bg-brand transition-transform ease-linear ${progressing ? "scale-x-100" : reducedMotion === true ? "scale-x-100" : "scale-x-0"}`}
                  style={{ transitionDuration: `${activeCapability.durationMs}ms` }}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
