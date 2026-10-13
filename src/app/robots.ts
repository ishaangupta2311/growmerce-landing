import type { MetadataRoute } from "next";
import { CRAWL_DISALLOW } from "@/lib/crawl-rules";
import { SITE_ORIGIN } from "@/lib/site-urls";

/**
 * Crawling rules, served at /robots.txt on the main site; what it disallows
 * is in src/lib/crawl-rules.ts. The Growsearch subdomain has its own, at
 * src/app/growsearch/robots.txt/route.ts, which next.config.ts rewrites to on
 * that host.
 *
 * The sitemap is named on `www`, which is the host the site serves: the apex
 * 308-redirects to it. A sitemap URL that redirects still works, but Search
 * Console reports it as a redirect rather than a sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: CRAWL_DISALLOW }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
