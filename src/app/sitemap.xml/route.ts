import { sitemapPosts } from "@/lib/blog/public";
import { MARKETING_PAGES } from "@/lib/site-pages";
import { SITE_ORIGIN } from "@/lib/site-urls";

/* Rebuilt when a post is published or unpublished (revalidateBlog), and at
   least every minute — the same cadence as the blog pages — so a scheduled
   post joins the sitemap on its own. One cheap query per rebuild.

   A route handler rather than `app/sitemap.ts`: the metadata-file convention
   hard-codes `Cache-Control: public, max-age=0, must-revalidate` on its
   response, and a Cache-Control the route sets itself is never replaced by the
   one Next derives from `revalidate` (`s-maxage=60, stale-while-revalidate=…`,
   which is what tells Vercel's CDN when to regenerate a page). Left to that
   header alone, the deployed sitemap was served from cache at any age and only
   changed when something called `revalidatePath`. This handler sets none. */
export const revalidate = 60;

type Entry = {
  path: string;
  lastModified?: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

/* Slugs are validated and origins are ours, but the one thing this writes
   into markup should not depend on that. */
function xml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(): Promise<Response> {
  const posts = await sitemapPosts();

  const entries: Entry[] = [
    ...MARKETING_PAGES.map(({ path }) => ({
      path: path === "/" ? "" : path,
      changeFrequency: path === "/blog" ? ("daily" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : path === "/blog" ? 0.8 : 0.6,
    })),
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      lastModified: post.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  const urls = entries.map((entry) =>
    [
      "<url>",
      `<loc>${xml(`${SITE_ORIGIN}${entry.path}`)}</loc>`,
      entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : null,
      `<changefreq>${entry.changeFrequency}</changefreq>`,
      `<priority>${entry.priority}</priority>`,
      "</url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
