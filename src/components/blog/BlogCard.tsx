import Link from "next/link";
import { formatPostDate } from "@/lib/blog/format";
import type { ArticleCard } from "@/lib/blog/types";
import BlogImage from "./BlogImage";

export default function BlogCard({ post, priority = false }: { post: ArticleCard; priority?: boolean }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className="group flex h-full flex-col rounded-[20px] border border-peach bg-white transition-[transform,box-shadow] duration-300 hover-lift [--lift:4px] hover:shadow-glow">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[16/10] overflow-hidden rounded-t-[19px] bg-cream">
        {post.featuredImage ? (
          <BlogImage
            src={post.featuredImage}
            alt=""
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 45vw, 100vw"
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#ffe4d6,transparent_60%),linear-gradient(135deg,#fff4ee,#ffe4d6)]">
            <span className="font-bricolage text-5xl font-extrabold text-brand/25">G</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        {post.categoryName && <p className="section-eyebrow text-[12px]">{post.categoryName}</p>}
        <h2 className="mt-2 text-[1.3rem] leading-snug font-extrabold tracking-[-0.015em] text-charcoal text-balance">
          <Link href={href} className="transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-body-mute">{post.excerpt}</p>}

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <p className="text-[13px] leading-snug text-muted">
            {post.authorName && <span className="block font-semibold text-charcoal">{post.authorName}</span>}
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          </p>
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-brand"
            aria-label={`Read more: ${post.title}`}
          >
            Read more
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
