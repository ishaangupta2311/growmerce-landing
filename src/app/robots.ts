import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-urls";

/**
 * Crawling rules, served at /robots.txt.
 *
 * The admin is signed-in only and carries noindex of its own
 * (src/app/admin/layout.tsx); keeping it out of here too means a crawler
 * never asks for it in the first place. /api/ holds form endpoints and the
 * preview job — nothing with a page to index, and the preview job costs money
 * to run.
 *
 * The sitemap is named on `www`, which is the host the site serves: the apex
 * 308-redirects to it. A sitemap URL that redirects still works, but Search
 * Console reports it as a redirect rather than a sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
