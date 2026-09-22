import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import BlogArticle from "@/components/blog/BlogArticle";
import { fallbackExcerpt, getLivePost, relatedPosts } from "@/lib/blog/public";
import { SLUG_PATTERN } from "@/lib/blog/slug";

export const revalidate = 60;

/* Rendered on first visit, then cached and revalidated — see /blog. */
export function generateStaticParams() {
  return [];
}

const SITE = "https://growmerce.ai";

/* generateMetadata and the page share one lookup per request. */
const load = cache(async (slug: string) => (SLUG_PATTERN.test(slug) ? getLivePost(slug) : null));

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const result = await load((await params).slug);
  if (!result) return { title: "Post not found", robots: { index: false } };

  const { article } = result;
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || fallbackExcerpt(article.excerpt, article.contentHtml, 160) || undefined;
  const image = article.ogImage || article.featuredImage;
  const url = `/blog/${article.slug}`;
  const keywords = article.seoKeywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    /* An SEO title is written to stand alone; the post title gets the site suffix. */
    title: article.seoTitle ? { absolute: article.seoTitle } : article.title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    authors: article.author ? [{ name: article.author.name }] : undefined,
    alternates: { canonical: article.canonicalUrl || url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Growmerce",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author.name] : undefined,
      section: article.category?.name,
      tags: article.tags.map((tag) => tag.name),
      images: image ? [{ url: image, alt: article.title }] : undefined,
    },
    twitter: {
      card: article.twitterCard,
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const result = await load((await params).slug);
  if (!result) notFound();

  const { article, categoryId } = result;
  const related = await relatedPosts(article.id!, categoryId);
  const image = article.ogImage || article.featuredImage;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.seoDescription || article.excerpt || undefined,
    image: image ? new URL(image, SITE).toString() : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author: article.author ? { "@type": "Person", name: article.author.name } : undefined,
    publisher: { "@type": "Organization", name: "Growmerce", url: SITE },
    mainEntityOfPage: { "@type": "WebPage", "@id": article.canonicalUrl || `${SITE}/blog/${article.slug}` },
    keywords: article.seoKeywords || undefined,
    articleSection: article.category?.name,
  };

  return (
    <>
      <script
        type="application/ld+json"
        /* `<` escaped so a title containing "</script>" cannot end the tag. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <BlogArticle article={article} related={related} />
    </>
  );
}
