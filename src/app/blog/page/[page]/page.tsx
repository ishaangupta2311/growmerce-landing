import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogIndex from "@/components/blog/BlogIndex";
import { listLivePosts } from "@/lib/blog/public";

export const revalidate = 60;

/* Empty: no pages are built ahead of time, each is rendered on its first
   visit and then cached like /blog. */
export function generateStaticParams() {
  return [];
}

function parse(value: string): number | null {
  return /^\d{1,5}$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({ params }: PageProps<"/blog/page/[page]">): Promise<Metadata> {
  const page = parse((await params).page);
  return {
    title: page ? `Blog — page ${page}` : "Blog",
    alternates: { canonical: page ? `/blog/page/${page}` : "/blog" },
  };
}

export default async function BlogPaged({ params }: PageProps<"/blog/page/[page]">) {
  const page = parse((await params).page);
  /* /blog/page/1 never reaches here — next.config.ts redirects it to /blog. */
  if (page === null || page < 2) notFound();

  const { items, pageCount } = await listLivePosts(page);
  if (page > pageCount) notFound();

  return <BlogIndex posts={items} page={page} pageCount={pageCount} />;
}
