import type { NextConfig } from "next";
import { GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "./src/lib/site-urls";

/**
 * Addresses people type from memory that are not where the page is: the
 * singular for the plural, the other common name for the same thing. Each one
 * forwards instead of ending on the 404 page.
 *
 * Temporary redirects, all of them. These are guesses about what a visitor
 * meant, and a browser caches a permanent one for ever — /login or /partners
 * may one day be a page of its own. Mixed-case addresses are handled
 * separately, in `src/proxy.ts`; a path that is still unknown after both gets
 * the suggestions on `src/app/not-found.tsx`.
 */
const ALIASES: Record<string, string[]> = {
  "/affiliates": ["/partners", "/partner", "/referrals", "/referral", "/affiliate-program"],
  "/affiliates/login": ["/login", "/signin", "/sign-in"],
  "/affiliates/signup": ["/signup", "/sign-up", "/register", "/apply"],
  "/pricing": ["/price", "/prices", "/plans"],
  "/products/ai-search": ["/product", "/products"],
  "/solutions": ["/solution"],
  "/compare": ["/comparison"],
  "/blog": ["/blogs"],
  "/contact": ["/contact-us"],
  "/about": ["/about-us"],
  "/help": ["/faq", "/faqs", "/support"],
  "/try": ["/demo"],
  "/privacy": ["/privacy-policy"],
  "/terms": ["/tos", "/terms-of-service", "/terms-and-conditions"],
};

const nextConfig: NextConfig = {
  // The iMac dev server is viewed from the MacBook over Tailscale. Next
  // blocks dev-only assets and HMR requests from that hostname unless it is
  // explicitly allowed.
  allowedDevOrigins: ["ishaans-imac.tail55a128.ts.net", "100.117.190.45"],

  /* `@sparticuz/chromium` keeps its ~100 MB browser as .br archives in its own
     bin/ and opens them by a path it computes at runtime. Next traces a page's
     files by statically reading its imports, requires and fs calls, and a path
     assembled at runtime is precisely what that cannot see — so the package can
     deploy without the binary it exists to unpack, and the preview job then
     degrades to stylesheet colours and no screenshot on every store, which is
     indistinguishable from a store that refused us. Naming the directory here
     costs nothing if the tracer would have found it anyway. */
  outputFileTracingIncludes: {
    "/api/preview": ["./node_modules/@sparticuz/chromium/bin/**"],
  },

  experimental: {
    serverActions: {
      /* Media uploads go through a Server Action, one image per request, and
         images may be up to 4 MB (src/lib/blog/types.ts). The default 1 MB
         would refuse most photos before our own checks ever saw them. */
      bodySizeLimit: "5mb",
    },
  },

  async headers() {
    /* The admin panel: never framed (clickjacking), never indexed, never
       leaking its URLs to other sites via Referer. */
    const admin = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ];
    return [
      { source: "/admin", headers: admin },
      { source: "/admin/:path*", headers: admin },
    ];
  },

  async redirects() {
    return [
      /* Page one of the blog listing is /blog itself. Done here rather than
         in the page so it never renders (a redirect thrown from an ISR page
         came back with a doubled Location header on a cache miss). */
      { source: "/blog/page/1", destination: "/blog", permanent: true },
      /* The admin used to be two: the blog's at /admin with its own login, and
         the affiliate program's at /affiliates/admin. It is one now, at /admin,
         behind the Supabase sign-in. The old affiliate address has moved for
         good; the old login page forwards to the one that exists, but is not
         marked permanent, because a browser caches a 308 for ever and that
         path may one day mean something again. */
      { source: "/affiliates/admin", destination: "/admin/affiliates", permanent: true },
      { source: "/affiliates/admin/:path*", destination: "/admin/affiliates/:path*", permanent: true },
      { source: "/admin/login", destination: "/affiliates/login?next=/admin", permanent: false },
      /* The program lives at /affiliates, and the singular is what people type
         from memory. Anything under it follows, so /affiliate/login works too. */
      { source: "/affiliate", destination: "/affiliates", permanent: true },
      { source: "/affiliate/:path*", destination: "/affiliates/:path*", permanent: true },
      /* A post address with the same slip keeps its slug. */
      { source: "/blogs/:path+", destination: "/blog/:path+", permanent: false },
      ...Object.entries(ALIASES).flatMap(([destination, sources]) =>
        sources.map((source) => ({ source, destination, permanent: false })),
      ),
      ...["growmerce.ai", "www.growmerce.ai"].flatMap((host) => [
        {
          source: "/growsearch",
          has: [{ type: "host" as const, value: host }],
          destination: GROWSEARCH_HOME,
          permanent: true,
        },
        {
          source: "/growsearch/features",
          has: [{ type: "host" as const, value: host }],
          destination: GROWSEARCH_FEATURES,
          permanent: true,
        },
      ]),
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "search.growmerce.ai" }],
          destination: "/growsearch",
        },
        {
          source: "/features",
          has: [{ type: "host", value: "search.growmerce.ai" }],
          destination: "/growsearch/features",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
