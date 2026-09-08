import type { NextConfig } from "next";
import { GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "./src/lib/site-urls";

const nextConfig: NextConfig = {
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

  async redirects() {
    return [
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
