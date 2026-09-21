import type { Metadata } from "next";

/* Nothing under /admin belongs in a search index. next.config.ts also sends
   X-Robots-Tag for the same paths, which covers non-HTML responses too. */
export const metadata: Metadata = {
  title: { template: "%s · Growmerce Admin", default: "Growmerce Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
