import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { formatPostDate, readingTime } from "@/lib/blog/format";
import { htmlToText } from "@/lib/blog/sanitize";
import type { ArticleCard, ArticleData } from "@/lib/blog/types";
import BlogCard from "./BlogCard";
import BlogImage from "./BlogImage";

/**
 * The article template. The public post page and the admin previews both
 * render through this, so a preview is the real design rather than an
 * approximation of it.
 *
 * `article.contentHtml` has been through the sanitiser allowlist
 * (src/lib/blog/sanitize.ts) by the time it reaches here.
 */
export default function BlogArticle({
  article,
  related = [],
  preview,
}: {
  article: ArticleData;
  related?: ArticleCard[];
  preview?: { label: string; backHref: string };
}) {
  const minutes = readingTime(htmlToText(article.contentHtml));
  const initials = article.author?.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {preview && (
        <div className="sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-charcoal px-4 py-2.5 text-center font-sans text-[13px] text-white">
          <span>
            <strong className="font-bold text-brand">Preview</strong> · {preview.label}
          </span>
          <Link href={preview.backHref} className="font-semibold underline underline-offset-2 hover:text-brand">
            Back to editor
          </Link>
        </div>
      )}
      <Navbar />
      <main className="font-bricolage">
        <article>
          <header className={article.featuredImage ? "bg-cream pb-28 lg:pb-40" : "border-b border-line bg-cream"}>
            <div className="mx-auto max-w-[860px] px-6 pt-10 pb-12 text-center lg:pt-16">
              <nav aria-label="Breadcrumb" className="hero-enter text-[13px] font-semibold text-muted">
                <Link href="/blog" className="hover:text-brand">
                  Blog
                </Link>
                {article.category && (
                  <>
                    <span aria-hidden className="mx-2">
                      /
                    </span>
                    <span className="text-brand">{article.category.name}</span>
                  </>
                )}
              </nav>
              <h1
                className="hero-enter mx-auto mt-5 max-w-[22ch] text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.06] font-extrabold tracking-[-0.03em] text-charcoal text-balance"
                style={{ animationDelay: "80ms" }}
              >
                {article.title}
              </h1>
              {article.excerpt && (
                <p
                  className="hero-enter mx-auto mt-5 max-w-[60ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-relaxed text-body-mute"
                  style={{ animationDelay: "140ms" }}
                >
                  {article.excerpt}
                </p>
              )}
              <div
                className="hero-enter mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[14px] text-muted"
                style={{ animationDelay: "200ms" }}
              >
                {article.author && (
                  <span className="inline-flex items-center gap-2.5 font-semibold text-charcoal">
                    {article.author.avatarUrl ? (
                      <span className="relative size-8 overflow-hidden rounded-full bg-peach">
                        <BlogImage src={article.author.avatarUrl} alt="" sizes="32px" />
                      </span>
                    ) : (
                      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-peach text-[12px] font-extrabold text-brand">
                        {initials}
                      </span>
                    )}
                    {article.author.name}
                  </span>
                )}
                {article.author && <span aria-hidden>·</span>}
                {article.publishedAt && <time dateTime={article.publishedAt}>{formatPostDate(article.publishedAt)}</time>}
                <span aria-hidden>·</span>
                <span>{minutes}</span>
              </div>
            </div>
          </header>

          {article.featuredImage && (
            <div className="mx-auto -mt-24 max-w-[1120px] px-6 lg:-mt-36">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[24px] border border-peach bg-peach shadow-glow">
                <BlogImage src={article.featuredImage} alt="" sizes="(min-width: 1120px) 1072px, 100vw" priority />
              </div>
            </div>
          )}

          <div className="mx-auto max-w-[740px] px-6 py-12 lg:py-16">
            <div className="blog-prose" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

            {article.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                <span className="mr-1 text-[13px] font-bold tracking-[0.12em] text-muted uppercase">Tags</span>
                {article.tags.map((tag) => (
                  <span key={tag.slug} className="rounded-full border border-peach bg-cream px-3 py-1 text-[13px] font-semibold text-charcoal">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {article.author && (
              <aside className="mt-10 flex gap-4 rounded-[20px] border border-peach bg-cream p-6">
                {article.author.avatarUrl ? (
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-peach">
                    <BlogImage src={article.author.avatarUrl} alt="" sizes="56px" />
                  </span>
                ) : (
                  <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-lg font-extrabold text-brand">
                    {initials}
                  </span>
                )}
                <div>
                  <p className="text-[12px] font-bold tracking-[0.14em] text-brand uppercase">Written by</p>
                  <p className="mt-1 text-lg font-extrabold text-charcoal">{article.author.name}</p>
                  {article.author.bio && <p className="mt-2 text-[15px] leading-relaxed text-body-mute">{article.author.bio}</p>}
                </div>
              </aside>
            )}
          </div>
        </article>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="border-t border-line bg-cream/60">
            <div className="mx-auto max-w-[1370px] px-6 py-14 lg:py-20">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Keep reading</p>
                  <h2 id="related-heading" className="mt-3 text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-extrabold tracking-[-0.03em] text-charcoal">
                    More from the blog
                  </h2>
                </div>
                <Link href="/blog" className="hidden shrink-0 text-[15px] font-bold text-brand hover:underline sm:inline">
                  All posts →
                </Link>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {related.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
