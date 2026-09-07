import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import DemoStoreButton from "@/components/site/DemoStoreButton";
import Arrow from "@/components/site/Arrow";
import { FaqList } from "@/components/site/Faq";
import { HELP_TOPICS } from "@/lib/faqs";

const CONTACT = "admin@growmerce.ai";

const TOTAL = HELP_TOPICS.reduce((n, t) => n + t.items.length, 0);

export const metadata: Metadata = {
  title: "Help centre",
  description:
    "Every question answered across the site, collected in one place — Growsearch, pricing and the trial, whether it suits your store, and how it compares with the alternatives.",
};

/**
 * The help centre.
 *
 * It holds no answers of its own: the topics come from src/lib/faqs.ts, which
 * is also what each page's own FAQ section renders. So this cannot fall behind
 * the pages it collects — there is one copy of every answer, and adding a
 * question anywhere puts it here too.
 */
export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-14 pb-10 lg:pt-20">
          <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
            &ndash; Help centre
          </p>
          <h1
            className="hero-enter mt-5 max-w-[18ch] text-[clamp(2rem,5.2vw,4.5rem)] leading-[1.04] font-extrabold tracking-tight text-balance"
            style={{ animationDelay: "90ms" }}
          >
            Every answer on the site,{" "}
            <span className="text-brand">in one place.</span>
          </h1>
          <p
            className="hero-enter mt-6 max-w-[58ch] text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-relaxed text-body-mute"
            style={{ animationDelay: "170ms" }}
          >
            {TOTAL} questions, gathered from across the site and grouped by what
            they are about. Nothing here is written twice &mdash; each answer
            also appears on the page it belongs to.
          </p>

          {/* Jump links. Eight groups is more than a reader should have to
              scroll past to find out what is covered. */}
          <nav
            aria-label="Topics"
            className="hero-enter mt-9 flex flex-wrap gap-2.5"
            style={{ animationDelay: "250ms" }}
          >
            {HELP_TOPICS.map((topic) => (
              <a
                key={topic.id}
                href={`#${topic.id}`}
                className="rounded-full bg-cream px-4 py-2 font-poppins text-[14px] font-bold text-charcoal ring-1 ring-brand/15 transition-colors hover:bg-peach hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {topic.title}
              </a>
            ))}
          </nav>
        </section>

        {/* Topics */}
        <div className="mx-auto max-w-[1370px] px-6 pb-8">
          {HELP_TOPICS.map((topic, i) => (
            <Reveal key={topic.id} delay={i === 0 ? 0 : 60}>
              <section
                id={topic.id}
                aria-labelledby={`${topic.id}-title`}
                className="scroll-mt-28 border-t border-line py-12 lg:py-16"
              >
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
                  <div className="lg:sticky lg:top-28">
                    <h2
                      id={`${topic.id}-title`}
                      className="font-poppins text-[clamp(1.5rem,2.8vw,2.25rem)] leading-tight font-extrabold tracking-tight text-balance"
                    >
                      {topic.title}
                    </h2>
                    <p className="mt-3 max-w-[38ch] text-[16px] leading-relaxed text-body-mute">
                      {topic.blurb}
                    </p>
                    <Link
                      href={topic.href}
                      className="mt-5 inline-flex items-center gap-2 font-poppins text-[15px] font-bold text-brand transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {topic.hrefLabel}
                      <Arrow className="size-4" />
                    </Link>
                  </div>

                  <FaqList items={topic.items} />
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        {/* Still stuck */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-20">
          <section
            aria-labelledby="help-contact-title"
            className="flex flex-col items-center gap-6 rounded-[26px] bg-cream px-8 py-12 text-center ring-1 ring-brand/15"
          >
            <h2
              id="help-contact-title"
              className="max-w-[24ch] font-poppins text-[clamp(1.5rem,3vw,2.5rem)] leading-tight font-extrabold text-balance"
            >
              Not answered here?
            </h2>
            <p className="max-w-[52ch] text-[17px] leading-relaxed text-body-mute">
              Write to us with your storefront and the question. The person who
              builds Growsearch is the person who answers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 [&>*]:max-[430px]:w-full">
              <Link href={`mailto:${CONTACT}`} className="cta-primary">
                Email us
                <Arrow className="cta-arrow size-5" />
              </Link>
              <DemoStoreButton className="cta-secondary" source="help-centre" />
            </div>
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
