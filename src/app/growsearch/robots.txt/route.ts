import { CRAWL_DISALLOW } from "@/lib/crawl-rules";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

/**
 * robots.txt for search.growmerce.ai, which next.config.ts rewrites /robots.txt
 * to on that host. Without it that host would answer with the main site's file
 * and point crawlers at the main site's sitemap.
 *
 * A route handler rather than a robots.ts, because Next only picks up robots.ts
 * at the root of the app. The lines are the ones robots.ts would produce.
 *
 * Route Handlers are rendered per request unless told otherwise, and this
 * answer never varies, so it is prerendered the way robots.ts output is.
 */
export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-Agent: *",
    "Allow: /",
    ...CRAWL_DISALLOW.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${GROWSEARCH_HOME}sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
