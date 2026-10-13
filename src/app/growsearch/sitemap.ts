import type { MetadataRoute } from "next";
import { GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "@/lib/site-urls";

/**
 * Sitemap for search.growmerce.ai, which next.config.ts rewrites /sitemap.xml
 * to on that host. The subdomain has exactly two pages of its own; every other
 * address it answers is a main-site page shared with www, and is listed there.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: GROWSEARCH_HOME, changeFrequency: "monthly", priority: 1 },
    { url: GROWSEARCH_FEATURES, changeFrequency: "monthly", priority: 0.6 },
  ];
}
