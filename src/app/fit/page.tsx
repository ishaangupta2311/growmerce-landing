import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Faq from "@/components/site/Faq";
import Reveal from "@/components/site/Reveal";
import TryFreeButton from "@/components/site/TryFreeButton";
import Arrow from "@/components/site/Arrow";
import { GROWSEARCH_DEMO } from "@/lib/site-urls";
import CatalogMock from "./components/CatalogMock";
import IntentMock from "./components/IntentMock";
import HeroArt from "./components/HeroArt";
import PlugInDiagram from "./components/PlugInDiagram";
import InsightsPanel from "./components/InsightsPanel";
import {
  BoltIcon,
  ChartDownIcon,
  ChartUpIcon,
  CubeIcon,
  GearsIcon,
  SearchIcon,
  SearchOffIcon,
  SmallBagIcon,
} from "./components/icons";

export const metadata: Metadata = {
  title: "Is Growmerce a fit for me?",
  description:
    "Growmerce is built for stores where search is a real lever — a growing catalogue, shoppers who use the search bar, no appetite for a six-week install. Here's where it fits, and where it doesn't.",
};

const CONTACT = "admin@growmerce.ai";

const NOT_A_FIT = [
  {
    n: "01",
    Icon: SmallBagIcon,
    title: "Your product catalog is still small",
    body: "If you only have a few products and customers can easily browse your store, advanced search may not be necessary yet.",
  },
  {
    n: "02",
    Icon: SearchOffIcon,
    title: "Search does not drive your sales",
    body: "If most of your customers find products through menus, collections or ads — and rarely use search — Growmerce may not create enough impact right now.",
  },
  {
    n: "03",
    Icon: GearsIcon,
    title: "You are looking for a general AI tool",
    body: "Growmerce is purpose-built for ecommerce search and discovery. If you need a full-suite AI solution for marketing, support, or operations, we may not be the right fit.",
  },
  {
    n: "04",
    Icon: ChartDownIcon,
    title: "Optimizing discovery is not a priority (yet)",
    body: "If improving search, product discovery, or customer journeys is not a key focus for your business right now, it might be better to revisit Growmerce later.",
  },
];

const FIT_FAQ = [
  {
    q: "How small is too small a catalogue?",
    a: "There is no hard number, but under roughly a hundred products a shopper can usually reach anything from your menus in two clicks, and search never becomes the path they take. The better signal is your own search volume: if the bar is barely used, fix that first — Growsearch makes search better, it does not make people start using it.",
  },
  {
    q: "How do I tell whether search actually drives my sales?",
    a: "Shopify reports on it. Compare the conversion rate of sessions that used search against sessions that did not — searchers usually convert several times better. If the gap is wide and the share of searching sessions is meaningful, search is a lever. If almost nobody searches, it is not.",
  },
  {
    q: "We are on WooCommerce, not Shopify. Can we use it?",
    a: "Not yet. Growsearch installs as a Shopify app today and WooCommerce is next on the roadmap — so for now the honest answer for a Woo store is to wait.",
  },
  {
    q: "What if we're not sure and want a second opinion?",
    a: "Say so. Send us your storefront and roughly what share of sessions use search, and we will tell you if it is not worth your money — we would rather lose the sale than have you cancel in month two.",
  },
  {
    q: "If we are a fit, how do we find out for certain?",
    a: "Run the 14-day trial on your own catalogue. Zero-result rate and search-attributed checkouts show up from day one, so the answer comes from your own store's numbers rather than from us.",
  },
];

export default function FitPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-14 pb-12 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div>
              <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
                &ndash; Fit check
              </p>
              <h1
                className="hero-enter mt-5 text-[clamp(2rem,5.4vw,4.75rem)] leading-[1.04] font-extrabold tracking-tight text-balance"
                style={{ animationDelay: "90ms" }}
              >
                Is Growmerce the{" "}
                <span className="text-brand">right fit for your store?</span>
              </h1>
              <p
                className="hero-enter mt-7 max-w-[52ch] text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-relaxed text-body-mute"
                style={{ animationDelay: "170ms" }}
              >
                Growmerce is built for ecommerce teams that want smarter search,
                better discovery, and more meaningful customer journeys.
              </p>
              {/* Same pairing as every other hero: the demo is the low-commitment
                  first step, the trial is the one behind the email gate. */}
              <div
                className="hero-enter mt-9 flex flex-wrap items-center gap-4 [&>*]:max-[430px]:w-full"
                style={{ animationDelay: "250ms" }}
              >
                <Link href={GROWSEARCH_DEMO} className="cta-primary">
                  See demo
                </Link>
                <TryFreeButton className="cta-secondary" source="fit-hero" />
              </div>
            </div>

            <div className="hero-enter-scale" style={{ animationDelay: "150ms" }}>
              <HeroArt className="mx-auto w-full max-w-[560px]" />
            </div>
          </div>
        </section>

        {/* The premise the rest of the page argues from. Full-bleed, so it
            breaks the column the way the Figma's orange band does. */}
        <section className="bg-brand py-7">
          <p className="mx-auto max-w-[1370px] px-6 text-center font-poppins text-[clamp(1.125rem,2.9vw,2.25rem)] leading-tight font-extrabold text-white text-balance">
            AI works best when it solves a real ecommerce challenge.
          </p>
        </section>

        {/* Good fit */}
        <section
          aria-labelledby="good-fit-title"
          className="mx-auto max-w-[1370px] px-6 pt-16 pb-8 lg:pt-24"
        >
          <Reveal>
            <h2 id="good-fit-title" className="mx-auto w-fit">
              <span className="block rounded-full bg-peach px-6 py-3 text-center font-poppins text-[clamp(1.125rem,2.6vw,2rem)] leading-tight font-extrabold text-charcoal sm:px-10">
                <span className="text-brand">Growmerce</span> is a good fit if:
              </span>
            </h2>
          </Reveal>

          <div className="mt-14 space-y-16 lg:mt-20 lg:space-y-28">
            <FitRow
              n="01"
              title="You have a growing product catalog"
              body="More products, more chances for shoppers to get lost."
              badge="Helps shoppers find the right products, faster."
              icon={<CubeIcon className="size-8" />}
              media={<CatalogMock />}
            />

            <FitRow
              n="02"
              flip
              title="Search matters to your store"
              body="The shoppers who use your search bar are the ones closest to buying."
              badge="Turn every search into a buying opportunity."
              icon={<SearchIcon className="size-8" />}
              media={<IntentMock />}
            />

            <FitRow
              n="03"
              title="You want AI without the complexity"
              body="No replatforming, no developer, no six-week onboarding."
              badge="Easy setup. Works with your existing store."
              icon={<BoltIcon className="size-8" />}
              media={<PlugInDiagram />}
            />

            <FitRow
              n="04"
              flip
              title="You want insights from what shoppers actually ask"
              body="Every query is a customer telling you what they came for."
              badge="See what shoppers search for and uncover new opportunities."
              icon={<ChartUpIcon className="size-8" />}
              media={<InsightsPanel />}
            />
          </div>
        </section>

        {/* Not a fit */}
        <section
          aria-labelledby="not-a-fit-title"
          className="mx-auto max-w-[1370px] px-6 pt-20 pb-8 lg:pt-28"
        >
          <Reveal>
            <h2 id="not-a-fit-title" className="mx-auto w-fit">
              <span className="block rounded-full bg-peach px-6 py-3 text-center font-poppins text-[clamp(1.125rem,2.6vw,2rem)] leading-tight font-extrabold text-charcoal sm:px-10">
                <span className="text-brand">Growmerce</span> may not be a good
                fit if:
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-center text-[17px] leading-relaxed text-body-mute">
              Not every store needs AI. Here are a few cases where Growmerce may
              not be the best match &mdash; yet.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {NOT_A_FIT.map((card, i) => (
              <Reveal key={card.n} delay={i * 80}>
                <article className="flex h-full gap-5 rounded-[22px] bg-cream p-6 ring-1 ring-brand/15 sm:gap-6 sm:p-8">
                  <span className="grid size-[62px] shrink-0 place-items-center rounded-full bg-peach text-charcoal sm:size-[72px]">
                    <card.Icon className="size-8 sm:size-9" />
                  </span>
                  <div>
                    <p className="w-fit rounded-[7px] bg-coral/85 px-2.5 py-0.5 font-poppins text-[13px] font-extrabold text-white">
                      {card.n}
                    </p>
                    <h3 className="mt-3 text-[clamp(1.125rem,1.9vw,1.375rem)] leading-snug font-extrabold text-charcoal">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[15.5px] leading-relaxed text-body-mute">
                      {card.body}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Still undecided */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pt-14 pb-4">
          <section
            aria-labelledby="undecided-title"
            className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[26px] bg-peach px-6 pt-8 text-center sm:px-10 lg:flex-row lg:gap-12 lg:pt-0 lg:pr-16 lg:pl-10 lg:text-left"
          >
            {/* At lg she is flush to the panel's bottom edge, as drawn — the
                panel carries no bottom padding on that side, so `self-end`
                crops her against it. Stacked, there is no edge to sit on and
                she is simply the picture above the copy. */}
            <Image
              src="/img/fit/thinking.svg"
              alt=""
              aria-hidden
              width={1890}
              height={1524}
              sizes="(min-width: 1024px) 300px, 240px"
              className="h-auto w-[210px] shrink-0 self-center sm:w-[250px] lg:w-[300px] lg:self-end"
            />

            <div className="relative z-10 pb-10 lg:py-12">
              <h2
                id="undecided-title"
                className="text-[clamp(1.375rem,2.6vw,2rem)] leading-tight font-extrabold text-charcoal"
              >
                Not sure if you&rsquo;re a fit?
              </h2>
              <p className="mt-3 max-w-[52ch] text-[16.5px] leading-relaxed text-body-mute">
                That&rsquo;s okay. Our team is happy to understand your use case
                and give an honest recommendation.
              </p>
              <Link
                href={`mailto:${CONTACT}?subject=Is%20Growmerce%20a%20fit%20for%20my%20store%3F`}
                className="cta-primary mt-7"
              >
                Talk to sales
                <Arrow className="cta-arrow size-5" />
              </Link>
            </div>

            {/* Decoration, and the first thing to go when the panel is narrow. */}
            <Image
              src="/img/fit/plane.svg"
              alt=""
              aria-hidden
              width={864}
              height={1530}
              sizes="150px"
              className="pointer-events-none absolute right-0 bottom-0 hidden h-full w-auto xl:block"
            />
          </section>
        </Reveal>

        <Faq items={FIT_FAQ} />
      </main>
      <Footer />
    </>
  );
}

/**
 * One "good fit if" beat: a numbered claim with a supporting chip on one side
 * and a picture of the thing on the other, alternating down the page.
 *
 * `flip` swaps the columns from lg up only — on a phone the text always leads,
 * because a reader who meets the picture first has nothing to read it against.
 */
function FitRow({
  n,
  title,
  body,
  badge,
  icon,
  media,
  flip = false,
}: {
  n: string;
  title: string;
  body: string;
  badge: string;
  icon: React.ReactNode;
  media: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <Reveal>
      <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-16">
        <div className={flip ? "lg:order-2" : undefined}>
          <span className="grid size-14 place-items-center rounded-full bg-brand font-poppins text-[20px] font-extrabold text-white">
            {n}
          </span>
          <h3 className="mt-6 max-w-[16ch] text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.08] font-extrabold tracking-tight text-balance">
            {title}
          </h3>
          <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-body-mute">
            {body}
          </p>
          <p className="mt-7 flex items-start gap-4">
            <span className="grid size-[62px] shrink-0 place-items-center rounded-[16px] bg-peach text-brand">
              {icon}
            </span>
            <span className="max-w-[34ch] self-center text-[16.5px] leading-snug font-bold text-body-mute">
              {badge}
            </span>
          </p>
        </div>

        <div className={`flex justify-center px-2 py-4 sm:px-6 sm:py-8 ${flip ? "lg:order-1" : ""}`}>
          {media}
        </div>
      </div>
    </Reveal>
  );
}
