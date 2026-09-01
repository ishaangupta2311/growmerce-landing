"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Reveal from "@/components/site/Reveal";

type Capability = {
  id: string;
  icon: string;
  /* The mark's intrinsic size. Declaring a square for a 66x63 icon makes the
     browser's computed height disagree with the attribute, which Next flags. */
  iconW: number;
  iconH: number;
  title: string;
  body: string;
  mediaSrc: string | null;
  durationMs: number;
};

const CAPABILITIES: Capability[] = [
  {
    id: "intent-based-search",
    icon: "/img/icon-search-circle.svg",
    iconW: 66,
    iconH: 63,
    title: "Intent based search",
    body: "Natural language, vague queries, prices, discounts, and product attributes work automatically.",
    mediaSrc: "/img/demos/rainy-commute.webp",
    durationMs: 5200,
  },
  {
    id: "zero-result-recovery",
    icon: "/img/icon-workflow.svg",
    iconW: 41,
    iconH: 41,
    title: "Zero-result recovery",
    body: "Fix typos, show alternatives, and never leave shoppers with an empty search page.",
    mediaSrc: "/img/demos/kava-drinks.webp",
    durationMs: 5800,
  },
  {
    id: "conversational-shopping",
    icon: "/img/icon-sparkle.svg",
    iconW: 23,
    iconH: 23,
    title: "Conversational shopping",
    body: "Refine results, switch products, and filter through a simple AI conversation.",
    mediaSrc: "/img/demos/gifts.webp",
    durationMs: 5600,
  },
  {
    id: "smart-suggestion",
    icon: "/img/icon-growth-circle.svg",
    iconW: 154,
    iconH: 150,
    title: "Smart suggestion",
    body: "Track searches, clicks, cart adds, purchases, and AI-assisted conversions in real time.",
    mediaSrc: "/img/demos/beauty-suggestions.webp",
    durationMs: 6200,
  },
];

const tabId = (id: string) => `growsearch-tab-${id}`;
const PANEL_ID = "growsearch-capability-panel";

export default function WhyGrowsearch() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerReset, setTimerReset] = useState(0);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tablistRef = useRef<HTMLDivElement>(null);
  const activeCapability = CAPABILITIES[activeIndex];

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "160px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion !== false || !isVisible) return;

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % CAPABILITIES.length);
    }, activeCapability.durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeCapability.durationMs, activeIndex, isVisible, reducedMotion, timerReset]);

  /* The strip scrolls on a phone, and the rotation moves the selection on its
     own — without this the active chip drifts out of sight. `block: "nearest"`
     keeps it from scrolling the page vertically as well. */
  useEffect(() => {
    const list = tablistRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

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
    <section ref={sectionRef} className="bg-peach py-20 lg:py-24">
      <div className="mx-auto max-w-[1370px] px-6">
        <Reveal>
          <div className="flex items-center justify-center gap-3 text-center">
            <Image
              src="/img/icon-search-circle.svg"
              alt=""
              width={66}
              height={63}
              className="h-11 w-auto shrink-0"
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
            {/* Below sm these are a scrolling strip, not a grid. Four cards
                deep enough to hold their body copy stack to about 640px on a
                phone, which puts the demo they control below the fold — so
                the thing being explained is never on screen with the
                explanation. As chips they cost one row, and the body text
                moves under the panel. */}
            <div
              ref={tablistRef}
              role="tablist"
              aria-label="Growsearch capabilities"
              className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
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
                    className="group relative flex w-auto shrink-0 items-center gap-2.5 rounded-full border-2 border-brand/15 bg-white/45 px-3.5 py-2.5 text-left transition-[background-color,border-color,box-shadow] duration-300 hover:border-brand/45 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[active=true]:border-brand data-[active=true]:bg-white data-[active=true]:shadow-glow sm:min-h-[116px] sm:w-full sm:shrink sm:items-start sm:gap-3 sm:rounded-[18px] sm:px-4 sm:py-4"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/12 transition-colors duration-300 group-data-[active=true]:bg-brand/18 sm:size-10">
                      <Image
                        src={capability.icon}
                        alt=""
                        width={capability.iconW}
                        height={capability.iconH}
                        className="h-6 w-auto"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold leading-tight whitespace-nowrap text-charcoal sm:text-base sm:whitespace-normal">
                        {capability.title}
                      </span>
                      {/* On a phone this reads under the panel instead, so
                          the chip stays one line tall. */}
                      <span className="mt-2 hidden text-sm leading-snug text-body-mute sm:block">
                        {capability.body}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 ml-auto hidden shrink-0 text-lg text-brand opacity-0 transition-opacity duration-300 group-data-[active=true]:opacity-100 sm:block"
                    >
                      ↗
                    </span>
                  </button>
                );
              })}
            </div>
            {/* The frame is capped to the mock's own width rather than run to
                the container, so there is nothing to letterbox: no bars, and
                the screenshot stays the size it was drawn at. */}
            <div
              id={PANEL_ID}
              role="tabpanel"
              aria-labelledby={tabId(activeCapability.id)}
              tabIndex={0}
              className="mx-auto mt-5 max-w-[880px] rounded-[26px] bg-white p-3 sm:mt-10 shadow-[0_30px_80px_-50px_rgba(23,23,23,0.6)] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:p-4"
            >
              {activeCapability.mediaSrc ? (
                <Image
                  src={activeCapability.mediaSrc}
                  alt={`${activeCapability.title} preview`}
                  width={1386}
                  height={1135}
                  sizes="(min-width: 940px) 880px, 92vw"
                  className="h-auto w-full rounded-[18px]"
                />
              ) : (
                <div className="flex min-h-[320px] flex-col justify-between rounded-[18px] bg-charcoal p-6 text-white sm:min-h-[420px] sm:p-8">
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
            </div>

            <p className="mx-auto mt-4 max-w-[46ch] text-center text-[15px] leading-snug text-body-mute sm:hidden">
              {activeCapability.body}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
