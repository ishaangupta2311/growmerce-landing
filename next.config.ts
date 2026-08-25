import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
