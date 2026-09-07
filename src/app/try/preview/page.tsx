import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PreviewStage from "../components/PreviewStage";

export const metadata: Metadata = {
  title: "Your Growsearch preview",
  /* One visitor's storefront, behind a fifteen-minute token: there is nothing
     here worth indexing and a stale copy in a result page would be worse than
     nothing. */
  robots: { index: false, follow: false },
};

export default function TryPreviewPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="mx-auto max-w-[1370px] px-6 pt-12 pb-16 lg:pt-16">
          <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
            &ndash; Live preview
          </p>
          <h1
            className="hero-enter mt-4 max-w-[20ch] text-[clamp(1.875rem,4.4vw,3.25rem)] leading-[1.06] font-extrabold tracking-tight text-balance"
            style={{ animationDelay: "90ms" }}
          >
            Growsearch, drawn on{" "}
            <span className="text-brand">your storefront.</span>
          </h1>

          <div className="mt-10 lg:mt-12">
            {/* PreviewStage reads `store` and `t` from the query string, so it
                is client-rendered; everything above it is not. */}
            <Suspense
              fallback={
                <div
                  aria-hidden
                  className="h-[420px] animate-pulse rounded-[26px] bg-cream"
                />
              }
            >
              <PreviewStage />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
