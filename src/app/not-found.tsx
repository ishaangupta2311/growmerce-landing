import type { Metadata } from "next";

import Footer from "@/components/site/Footer";
import Navbar from "@/components/site/Navbar";
import NotFoundSuggestion from "@/components/site/NotFoundSuggestion";

export const metadata: Metadata = { title: "Page not found" };

/**
 * What an address that leads nowhere gets.
 *
 * Most wrong addresses never arrive here. The common slips are forwarded
 * before a page is looked for at all — the other names for a page in
 * `next.config.ts`, capital letters in `src/proxy.ts`. This is for what is
 * left: a typo nobody predicted, or a link to something that has gone. It
 * offers the nearest real page instead of only saying no.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="mx-auto max-w-[760px] px-6 py-24 text-center lg:py-32">
          <p className="font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
            &ndash; 404
          </p>
          <h1 className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)] leading-[1.04] font-extrabold tracking-tight text-balance">
            There is no page at this address.
          </h1>
          <p className="mx-auto mt-6 max-w-[48ch] text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-relaxed text-body-mute">
            The link may be out of date, or the address may have a typo in it.
          </p>
          <NotFoundSuggestion />
        </section>
      </main>
      <Footer />
    </>
  );
}
