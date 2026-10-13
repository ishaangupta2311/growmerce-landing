import type { MetadataRoute } from "next";
import { sitemapPosts } from "@/lib/blog/public";
import { MARKETING_PAGES } from "@/lib/site-pages";
import { SITE_ORIGIN } from "@/lib/site-urls";

/* Rebuilt when a post is published or unpublished (revalidateBlog), and at
   least every minute — the same cadence as the blog pages — so a scheduled
   post joins the sitemap on its own. One cheap query per rebuild. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sitemapPosts();

  return [
    ...MARKETING_PAGES.map(({ path }) => ({
      url: `${SITE_ORIGIN}${path === "/" ? "" : path}`,
      changeFrequency: (path === "/blog" ? "daily" : "monthly") as "daily" | "monthly",
      priority: path === "/" ? 1 : path === "/blog" ? 0.8 : 0.6,
    })),
    ...posts.map((post) => ({
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      lastModified: post.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
