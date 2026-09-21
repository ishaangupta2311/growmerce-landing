import type { MetadataRoute } from "next";
import { sitemapPosts } from "@/lib/blog/public";

/* Rebuilt when a post is published or unpublished (revalidateBlog), and at
   least every minute — the same cadence as the blog pages — so a scheduled
   post joins the sitemap on its own. One cheap query per rebuild. */
export const revalidate = 60;

const SITE = "https://growmerce.ai";

/* The public marketing pages on growmerce.ai. Growsearch's own pages live on
   search.growmerce.ai, and the /v concepts are archived — neither belongs here. */
const PAGES = ["/", "/about", "/pricing", "/solutions", "/compare", "/fit", "/try", "/contact", "/help", "/blog", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sitemapPosts();

  return [
    ...PAGES.map((path) => ({
      url: `${SITE}${path === "/" ? "" : path}`,
      changeFrequency: (path === "/blog" ? "daily" : "monthly") as "daily" | "monthly",
      priority: path === "/" ? 1 : path === "/blog" ? 0.8 : 0.6,
    })),
    ...posts.map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: post.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
