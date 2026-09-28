import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CtaPair from "@/components/site/CtaPair";
import Faq from "@/components/site/Faq";
import { ABOUT_FAQ } from "@/lib/faqs";
import Reveal from "@/components/site/Reveal";
import { PlatformLogos } from "@/components/site/PlatformStrip";
import BlogCard from "@/components/blog/BlogCard";
import { latestPosts } from "@/lib/blog/public";
import ToolDock from "./components/ToolDock";
import HowItWorks from "./components/HowItWorks";
import WhyExists from "./components/WhyExists";
import BuiltForEcommerce from "./components/BuiltForEcommerce";
import InAction from "./components/InAction";
import SkipTheCall from "./components/SkipTheCall";
import NotAllAi from "./components/NotAllAi";
import CustomPlanForm from "./components/CustomPlanForm";

/* The latest blog posts are shown near the foot, so the page is rebuilt with
   the blog: at most once a minute, and at once when a post is published. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "What is Growmerce",
  description:
    "Growmerce owns, builds and runs practical AI tools for ecommerce. One tool at a time, installed into the store you already have.",
};

const CONVICTIONS = [
  "One tool at a time — Growsearch first, and the next one gets a name when it has customers",
  "It installs into the store you already run: no replatforming, no migration, no AI team",
  "Grounded in your catalogue — the model never invents a product, a price or a promise",
  "Every tool reports on itself, so it is judged on revenue rather than on vibes",
  "Priced as a flat monthly number you can cancel, with no revenue share",
];

export default async function AboutPage() {
  const posts = await latestPosts(3);
  return (
    <>
      <Navbar />
      <main className="bg-cream font-bricolage">
        {/* Hero */}
        <section className="mx-auto max-w-[1370px] px-6 pt-16 pb-14 text-center lg:pt-24">
          <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.2em] text-brand uppercase">
            What is Growmerce
          </p>
          <h1
            className="hero-enter mx-auto mt-5 max-w-[26ch] text-[clamp(2rem,5.4vw,5rem)] leading-[1.05] font-extrabold tracking-tight text-balance"
            style={{ animationDelay: "90ms" }}
          >
            We build the AI tools store owners actually{" "}
            <span className="text-brand">need</span>
          </h1>
          <p
            className="hero-enter mx-auto mt-7 max-w-[68ch] text-[clamp(1.0625rem,1.6vw,1.5rem)] leading-relaxed text-body-mute"
            style={{ animationDelay: "160ms" }}
          >
            AI is now expected on every online store. Getting it shouldn&rsquo;t
            require a narrow one-trick app or a full platform migration.
            Growmerce builds focused AI tools that install directly into the
            Shopify store you already run. Growsearch, our AI-powered search
            app, is the first one, and it has to earn its place in your own
            sales numbers.
          </p>
          <CtaPair
            className="mt-10 justify-center"
            primaryHref="/try"
            secondaryHref="/solutions"
            secondaryLabel="See all our products"
          />
        </section>

        {/* You will find us on */}
        <Reveal className="mx-auto max-w-[1370px] px-6 pb-16">
          <div className="flex flex-col items-center gap-7 rounded-[22px] border-2 border-brand bg-peach/60 px-8 py-6 lg:flex-row lg:justify-center lg:gap-14">
            <p className="shrink-0 font-poppins text-[clamp(1.125rem,1.8vw,1.5rem)] leading-tight font-extrabold text-brand uppercase">
              You will
              <br className="hidden lg:block" /> find us on
            </p>
            <PlatformLogos />
          </div>
        </Reveal>

        {/* Orange convictions band */}
        <section aria-labelledby="convictions-title" className="bg-brand py-16 text-white lg:py-24">
          <div className="mx-auto grid max-w-[1370px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            <div className="hidden justify-center lg:flex">
              <ToolDock />
            </div>
            <div>
              <h2
                id="convictions-title"
                className="text-[clamp(1.75rem,3.4vw,3rem)] leading-tight font-extrabold"
              >
                What we hold to
              </h2>
              <ul className="mt-8 space-y-5">
                {CONVICTIONS.map((c) => (
                  <li key={c} className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-white text-brand"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[clamp(1rem,1.5vw,1.25rem)] leading-snug">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <HowItWorks />
        <WhyExists />
        <BuiltForEcommerce />
        <InAction />
        <SkipTheCall />
        <NotAllAi />
        <CustomPlanForm />

        {/* The latest posts; left out entirely while the blog is empty. */}
        {posts.length ? (
          <section aria-labelledby="blog-title" className="mx-auto max-w-[1370px] px-6 pb-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="blog-title" className="text-[clamp(1.875rem,3.6vw,3rem)] font-extrabold tracking-tight">
                From the blog
              </h2>
              <Link href="/blog" className="text-[16px] font-bold text-brand hover:underline">
                All posts &rarr;
              </Link>
            </Reveal>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        ) : null}

        <Faq items={ABOUT_FAQ} />
      </main>
      <Footer />
    </>
  );
}
