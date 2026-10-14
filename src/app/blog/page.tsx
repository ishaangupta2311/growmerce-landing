import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import { listLivePosts } from "@/lib/blog/public";
import { BLOG_CARD } from "@/lib/blog/share";
import { SHARED_OPEN_GRAPH } from "@/lib/page-metadata";

/* Rebuilt in the background at most once a minute, and immediately when an
   admin publishes (see src/lib/blog/revalidate.ts). The minute is what lets a
   scheduled post appear without anyone pressing a button. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical writing on ecommerce search, conversion and running a store, from the team building Growmerce.",
  alternates: { canonical: "/blog" },
  openGraph: { ...SHARED_OPEN_GRAPH, ...BLOG_CARD, url: "/blog" },
};

export default async function BlogPage() {
  const { items, pageCount } = await listLivePosts(1);
  return <BlogIndex posts={items} page={1} pageCount={pageCount} />;
}
