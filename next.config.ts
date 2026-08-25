import type { NextConfig } from "next";
import { GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "./src/lib/site-urls";

const nextConfig: NextConfig = {
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
