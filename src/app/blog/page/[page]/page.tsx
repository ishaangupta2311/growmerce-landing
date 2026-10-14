import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogIndex from "@/components/blog/BlogIndex";
import { listLivePosts } from "@/lib/blog/public";
import { BLOG_CARD } from "@/lib/blog/share";
import { SHARED_OPEN_GRAPH } from "@/lib/page-metadata";

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
  const path = page ? `/blog/page/${page}` : "/blog";
  return {
    title: page ? `Blog: page ${page}` : "Blog",
    alternates: { canonical: path },
    /* Without this the page would share the homepage's card. It is /blog's
       card with the page number, so the pages of one list stay distinguishable. */
    openGraph: {
      ...SHARED_OPEN_GRAPH,
      title: page ? `${BLOG_CARD.title}: page ${page}` : BLOG_CARD.title,
      description: BLOG_CARD.description,
      url: path,
    },
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
