import { sitemapPosts } from "@/lib/blog/public";
import { MARKETING_PAGES } from "@/lib/site-pages";
import { SITE_ORIGIN } from "@/lib/site-urls";

/* Served on demand and cached by the CDN for a minute, so a post that goes
   live (or is scheduled to) joins the sitemap on its own, and the query runs
   about once a minute per CDN region however often crawlers ask.

   Not an ISR route (`export const revalidate`). That was tried twice, as the
   metadata file `app/sitemap.ts` and as this handler, and on Vercel neither
   ever regenerated on the timer: the response sat at `x-vercel-cache: HIT`
   with `age` in the thousands while `/blog`, same setting, refreshed every
   minute. The build output was right (the route is a Prerender with a
   60-second expiry, exactly like `/blog`), and why the platform ignored it for
   this path is not known. The first theory, that the metadata convention's
   hard-coded Cache-Control was in the way, was wrong: the handler fared no
   better without one. What Vercel documents for a function's response is the
   Cache-Control below, so that is what this relies on.

   - `s-maxage=60`: the CDN may serve it for a minute.
   - `stale-while-revalidate`: after that it serves the old copy once while
     fetching a new one, so a crawler never waits on the database.
   - `stale-if-error`: if the origin errors, the CDN serves the old copy
     instead, and does not cache the error.

   When the database is down there is nothing to say, and an empty sitemap would
   tell a crawler every post is gone. So it answers 503 with `no-store`, which
   crawlers retry, never caches, and which `stale-if-error` replaces with the
   last good copy while there is one. See `sitemapPosts`. */
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=86400, stale-if-error=604800";

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
  let posts: Awaited<ReturnType<typeof sitemapPosts>>;
  try {
    posts = await sitemapPosts();
  } catch (err) {
    console.error("[sitemap]", err instanceof Error ? err.message : err);
    return new Response("The sitemap is temporarily unavailable.", {
      status: 503,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }

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

  return new Response(body, {
    headers: { "Content-Type": "application/xml", "Cache-Control": CACHE_CONTROL },
  });
}
