import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

/* A paragraph, or a bulleted list of them. */
type Block = ReactNode | { list: ReactNode[] };

export type LegalSection = {
  id: string;
  heading: string;
  body: Block[];
};

function isList(block: Block): block is { list: ReactNode[] } {
  return typeof block === "object" && block !== null && "list" in block;
}

/* Legal pages are read, not scanned, so they drop the marketing type scale for
   a single comfortable measure. The contents rail keeps a long policy
   navigable without turning it into a landing page. */
export default function LegalDoc({
  title,
  updatedLabel,
  updated,
  intro,
  sections,
}: {
  title: string;
  updatedLabel?: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="border-b border-line bg-cream">
          <div className="mx-auto max-w-[1370px] px-6 py-14 lg:py-20">
            <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
              &ndash; Legal
            </p>
            <h1
              className="hero-enter mt-4 text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.06] font-extrabold tracking-tight"
              style={{ animationDelay: "80ms" }}
            >
              {title}
            </h1>
            <p
              className="hero-enter mt-4 text-[15px] font-semibold text-muted"
              style={{ animationDelay: "140ms" }}
            >
              {updatedLabel ?? "Last updated"} {updated}
            </p>
            <p
              className="hero-enter mt-6 max-w-[70ch] text-[clamp(1rem,1.35vw,1.1875rem)] leading-relaxed text-body-mute"
              style={{ animationDelay: "200ms" }}
            >
              {intro}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1370px] gap-12 px-6 py-14 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16 lg:py-20">
          <nav aria-label="On this page" className="lg:sticky lg:top-[108px] lg:self-start">
            <p className="font-poppins text-[12px] font-semibold tracking-[0.14em] text-charcoal/55 uppercase">
              On this page
            </p>
            {/* Padding, not gap: a 15px line box is 18px tall, and on a phone
                this is a list of navigation targets like any other. */}
            <ol className="mt-3 space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-block py-1.5 text-[15px] leading-snug text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* No scroll reveals here on purpose: a policy should be readable the
              moment it loads, not faded in a clause at a time. */}
          <div className="max-w-[70ch]">
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-[108px] ${i > 0 ? "mt-10 border-t border-line pt-10" : ""}`}
              >
                <h2 className="text-[clamp(1.25rem,2vw,1.625rem)] leading-snug font-bold">
                  {section.heading}
                </h2>
                <div className="mt-3 h-[3px] w-[52px] bg-brand" />
                {section.body.map((block, j) =>
                  isList(block) ? (
                    <ul key={j} className="mt-4 space-y-2.5">
                      {block.list.map((item, k) => (
                        <li
                          key={k}
                          className="flex gap-3 text-[16.5px] leading-relaxed text-body-mute"
                        >
                          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      key={j}
                      className="mt-4 text-[16.5px] leading-relaxed text-body-mute"
                    >
                      {block}
                    </p>
                  ),
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
