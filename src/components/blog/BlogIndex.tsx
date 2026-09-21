import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import type { ArticleCard } from "@/lib/blog/types";
import { clsx } from "@/lib/clsx";
import BlogCard from "./BlogCard";

/** The blog listing, shared by /blog and /blog/page/[page]. */
export default function BlogIndex({
  posts,
  page,
  pageCount,
}: {
  posts: ArticleCard[];
  page: number;
  pageCount: number;
}) {
  const href = (n: number) => (n <= 1 ? "/blog" : `/blog/page/${n}`);

  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="border-b border-line bg-cream">
          <div className="mx-auto max-w-[1370px] px-6 py-14 text-center lg:py-20">
            <p className="hero-enter section-eyebrow">The Growmerce blog</p>
            <h1
              className="hero-enter mx-auto mt-4 max-w-[20ch] text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.04] font-extrabold tracking-[-0.03em] text-charcoal text-balance"
              style={{ animationDelay: "80ms" }}
            >
              Notes on search, stores and <span className="text-brand">selling more</span>
            </h1>
            <p
              className="hero-enter section-lede mx-auto mt-5 max-w-[58ch]"
              style={{ animationDelay: "140ms" }}
            >
              Practical writing for people running ecommerce stores — what we are building, what we are learning, and
              what actually moves revenue.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1370px] px-6 py-14 lg:py-20">
          {posts.length === 0 ? (
            <div className="mx-auto max-w-md rounded-[20px] border border-peach bg-cream px-8 py-14 text-center">
              <p className="text-xl font-extrabold text-charcoal">New posts are on the way</p>
              <p className="mt-2 text-[15px] leading-relaxed text-body-mute">
                Nothing is published yet. Check back soon.
              </p>
              <Link href="/" className="cta-secondary mt-6 !px-5 !py-2.5 !text-[15px]">
                Back to home
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <BlogCard key={post.id} post={post} priority={page === 1 && index < 3} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav aria-label="Blog pages" className="mt-14 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={href(page - 1)} className="rounded-[10px] border border-line px-4 py-2 text-[15px] font-bold text-charcoal hover:border-brand hover:text-brand">
                  ← Newer
                </Link>
              )}
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={clsx(
                    "grid size-10 place-items-center rounded-[10px] text-[15px] font-bold",
                    n === page ? "bg-brand text-white" : "text-charcoal hover:bg-cream hover:text-brand",
                  )}
                >
                  {n}
                </Link>
              ))}
              {page < pageCount && (
                <Link href={href(page + 1)} className="rounded-[10px] border border-line px-4 py-2 text-[15px] font-bold text-charcoal hover:border-brand hover:text-brand">
                  Older →
                </Link>
              )}
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
