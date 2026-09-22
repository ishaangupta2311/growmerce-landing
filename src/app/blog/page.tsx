import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import { listLivePosts } from "@/lib/blog/public";

/* Rebuilt in the background at most once a minute, and immediately when an
   admin publishes (see src/lib/blog/revalidate.ts). The minute is what lets a
   scheduled post appear without anyone pressing a button. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical writing on ecommerce search, conversion and running a store — from the team building Growmerce.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "The Growmerce blog",
    description: "Practical writing on ecommerce search, conversion and running a store.",
    url: "/blog",
    siteName: "Growmerce",
    type: "website",
  },
};

export default async function BlogPage() {
  const { items, pageCount } = await listLivePosts(1);
  return <BlogIndex posts={items} page={1} pageCount={pageCount} />;
}
