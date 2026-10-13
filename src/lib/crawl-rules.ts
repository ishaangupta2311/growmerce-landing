/**
 * What crawlers are asked to stay out of, shared by the robots.txt of the main
 * site (src/app/robots.ts) and of the Growsearch subdomain
 * (src/app/growsearch/robots.txt/route.ts). The subdomain runs this same app,
 * so /admin and /api/ answer on it too and are kept out of both for the same
 * reasons.
 *
 * The admin is signed-in only and carries noindex of its own
 * (src/app/admin/layout.tsx); keeping it out of here too means a crawler
 * never asks for it in the first place. /api/ holds form endpoints and the
 * preview job — nothing with a page to index, and the preview job costs money
 * to run.
 */
export const CRAWL_DISALLOW = ["/admin", "/api/"];
