import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import ContactForm from "./components/ContactForm";

export const metadata: Metadata = pageMetadata({
  title: "Contact us",
  description: "Tell Growmerce about your business and what is holding its growth back.",
  path: "/contact",
});

/** Rising bars beside the headline: growth, drawn rather than described. */
function GrowthBars({ className }: { className?: string }) {
  const bars = [34, 52, 44, 70, 88, 118];
  return (
    <svg viewBox="0 0 300 140" fill="none" aria-hidden className={className}>
      {bars.map((height, index) => (
        <rect
          key={index}
          x={8 + index * 49}
          y={132 - height}
          width="34"
          height={height}
          rx="9"
          fill="var(--color-brand)"
          opacity={0.22 + index * 0.15}
        />
      ))}
      <path
        d="M25 92 74 74l49 6 49-28 49-18 49-28"
        stroke="var(--color-charcoal)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="270" cy="6" r="6" fill="var(--color-charcoal)" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="mx-auto max-w-[1370px] px-6 pt-10 pb-24 lg:pt-16">
          <Reveal className="relative overflow-hidden rounded-[30px] bg-cream px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 size-[420px] rounded-full bg-brand/20 blur-[90px]" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <p className="font-poppins text-[13px] font-extrabold tracking-[0.2em] text-brand uppercase">
                  Contact us
                </p>
                <h1 className="section-display mt-4 font-extrabold">
                  What&rsquo;s holding your growth back?
                </h1>
                <p className="section-lede mt-5 max-w-[40ch]">
                  Tell us a little about your business. We&rsquo;ll get back to you within one working day.
                </p>
                <GrowthBars className="mt-10 hidden w-full max-w-[340px] lg:block" />
              </div>

              <ContactForm />
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
